(function($, _, Backbone, enyo) {
    chuisy = {
        apiRoot: "http://127.0.0.1:8000/api/",
        // apiRoot: "http://chuisy-staging.herokuapp.com/api/",
        // apiRoot: "http://www.chuisy.com/api/",
        version: "v1",
        online: false,
        init: function() {
            chuisy.accounts.fetch();
            var user = chuisy.accounts.getActiveUser();
            if (user && user.isAuthenticated()) {
                Backbone.Tastypie.authCredentials = {
                    username: user.get("username"),
                    apiKey: user.get("api_key")
                };
            }
            user.friends.fetchAll();
            chuisy.feed.fetch();
            chuisy.notifications.fetch();
            chuisy.notifications.startPolling(60000);
        },
        setOnline: function(online) {
            var goneOnline = online && !chuisy.online;
            chuisy.online = online;
            if (goneOnline && this.authCredentials) {
                chuisy.closet.sync();
            }
        },
        /**
            Validate user credentials and obtain api key and profile data
        */
        signIn: function(fb_access_token, success, failure) {
            var user = new chuisy.models.User();
            user.authenticate(fb_access_token, function() {
                chuisy.accounts.add(user);
                chuisy.accounts.setActiveUser(user);
                user.save();
                Backbone.Tastypie.authCredentials = {
                    username: user.get("username"),
                    apiKey: user.get("api_key")
                };
                user.fetch({
                    remote: true,
                    success: function() {
                        user.save();
                    }
                });
                // enyo.Signals.send("onSignInSuccess", {user: user});
            }, function() {
                // enyo.Signals.send("onSignInFail");
            });
        }
    };

    var timeToText = function(time) {
        if (!time) {
            return null;
        }

        var now = new Date();
        var posted = new Date(time);
        var seconds = (now.getTime() - posted.getTime()) / 1000;
        var minutes = seconds / 60;
        var hours = minutes / 60;
        var days = hours / 24;
        var f = Math.floor;

        if (minutes < 1) {
            return $L("A few seconds ago");
        } else if (hours < 1) {
            return $L("{{ minutes }} minutes ago").replace("{{ minutes }}", f(minutes));
        } else if (days < 1) {
            return $L("{{ hours }} hours ago").replace("{{ hours }}", f(hours));
        } else if (days < 30) {
            return $L("{{ days }} days ago").replace("{{ days }}", f(days));
        } else {
            return $L("A while back...");
        }
    };

    var createThumbnail = function(imgSrc, width, height, callback) {
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext("2d");
        var img = new Image();
        img.onload = function() {
            var targetWidth, targetHeight, targetX, targetY;
            if (img.width < img.height) {
                targetWidth = width;
                targetHeight = width/img.width*img.height;
                targetX = 0;
                targetY = (height-targetHeight)/2;
            } else {
                targetWidth = height/img.height*img.width;
                targetHeight = height;
                targetX = (width-targetWidth)/2;
                targetY = 0;
            }

            context.drawImage(img, targetX, targetY, targetWidth, targetHeight);
            callback(canvas.toDataURL());
        };
        img.src = imgSrc;
    };

    var upload = function(source, target, fileKey, fileName, mimeType, success, failure) {
        try {
            var options = new FileUploadOptions();
            options.fileKey = fileKey;
            options.fileName = fileName;
            options.mimeType = mimeType;

            var ft = new FileTransfer();
            ft.upload(source, target, function(r) {
                if (success) {
                    success();
                }
            }, function(error) {
                console.error("File upload failed! " + error);
                if (failure) {
                    failure(error);
                }
            }, options);
        } catch (e) {
            console.error("Could not start file upload. " + e);
        }
    };

    chuisy.models = {};

    chuisy.models.User = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/user/",
        authUrl: chuisy.apiRoot + chuisy.version + "/authenticate/",
        initialize: function(attributes, options) {
            Backbone.Tastypie.Model.prototype.initialize.call(this, attributes, options);
            this.followers = new chuisy.models.UserCollection([], {
                url: _.result(this, "url") + "/followers/"
            });
            this.following = new chuisy.models.UserCollection([], {
                url: _.result(this, "url") + "/following/"
            });
            this.friends = new chuisy.models.UserCollection([], {
                url: _.result(this, "url") + "/friends/"
            });
        },
        save: function(attributes, options) {
            attributes = attributes || {};
            var profile = _.clone(this.get("profile"));
            if (profile.resource_uri && (!(this.collection && this.collection.localStorage) || options && options.remote)) {
                attributes.profile = profile.resource_uri;
            }
            Backbone.Tastypie.Model.prototype.save.call(this, attributes, options);
            this.set("profile", profile);
        },
        authenticate: function(fbAccessToken, success, failure) {
            Backbone.ajax(this.authUrl, {
                data: {fb_access_token: fbAccessToken},
                dataType: "json",
                context: this,
                success: function(data) {
                    this.set("api_key", data.api_key);
                    this.set("fb_permissions", data.fb_permissions);
                    this.id = data.id;
                    if (success) {
                        success(this);
                    }
                },
                error: function(error) {
                    if (failure) {
                        failure(error);
                    }
                }
            });
        },
        isAuthenticated: function() {
            return this.get("username") && this.get("api_key") ? true : false;
        },
        setAvatar: function(uri) {
            var target = encodeURI(_.result(this, "url") + "/upload_avatar/?username=" +
                this.authCredentials.username + "&api_key=" + this.authCredentials.api_key);
            upload(uri, target, "image", uri.substr(uri.lastIndexOf('/')+1), "image/jpeg", function() {
                this.fetch({remote: true});
            });
        },
        addDevice: function(deviceToken) {
            if (!deviceToken) {
                console.error("No device token provided.");
                return;
            }
            if (!this.isAuthenticated()) {
                console.error("Can't add a device. User is not authenticated.");
                return;
            }

            var options = {
                url: chuisy.apiRoot + chuisy.version + "/device/add/",
                data: {token: deviceToken},
                type: "POST",
                contentType: "application/json"
            };
            Backbone.Tastypie.addAuthentication("create", this, options);
            Backbone.ajax(options);
        },
        setFollowing: function(following) {
            var activeUser = chuisy.accounts.getActiveUser();

            if (!activeUser || !activeUser.isAuthenticated()) {
                console.error("There has to be an active authenticated user to perform this action!");
                return;
            }
            if (activeUser.id == this.id) {
                console.error("User can't follow himself.");
                return;
            }

            this.set("following", following);

            var options = {
                url: _.result(this, "url") + "/follow/",
                data: {follow: following},
                type: "POST",
                contentType: "application/json"
            };
            Backbone.Tastypie.addAuthentication("create", this, options);
            Backbone.ajax(options);
        },
        follow: function() {
            this.setFollowing(true);
        },
        unfollow: function() {
            this.setFollowing(false);
        },
        toggleFollow: function() {
            this.setFollowing(!this.get("following"));
        }
    });

    chuisy.models.OwnedModel = Backbone.Tastypie.Model.extend({
        save: function(attributes, options) {
            options = options || {};
            options.attrs = this.toJSON();
            _.extend(options.attrs, attributes);
            delete options.attrs.user;
            Backbone.Tastypie.Model.prototype.save.call(this, attributes, options);
        }
    });

    chuisy.models.ChuComment = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/chucomment/",
        getTimeText: function() {
            return timeToText(this.get("time"));
        }
    });

    chuisy.models.ChuCommentCollection = Backbone.Tastypie.Collection.extend({
        model: chuisy.models.ChuComment,
        url: chuisy.apiRoot + chuisy.version + "/chucomment/",
        filters: function() {
            return this.chu ? {chu: this.chu.id} : {};
        },
        initialize: function(models, options) {
            Backbone.Tastypie.Collection.prototype.initialize.call(this, models, options);
            this.chu = options.chu;
        },
        add: function(models, options) {
            models = _.isArray(models) ? models : [models];
            if (this.chu) {
                for (var i=0, el=models[i]; i<models.length; i++) {
                    if (el instanceof Backbone.Model) {
                        el.set("chu", this.chu.get("resource_uri"));
                    } else {
                        el.chu = this.chu.get("resource_uri");
                    }
                }
            }
            Backbone.Tastypie.Collection.prototype.add.call(this, models, options);
        }
    });

    chuisy.models.Chu = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/chu/",
        initialize: function(attributes, options) {
            chuisy.models.OwnedModel.prototype.initialize.call(this, attributes, options);
            this.comments = new chuisy.models.ChuCommentCollection([], {chu: this});
        },
        save: function(attributes, options) {
            attributes = attributes || {};
            var friends = attributes.friends || _.clone(this.get("friends"));
            if (!(this.collection && this.collection.localStorage) || options && options.remote) {
                attributes.friends = _.pluck(friends, "resource_uri");
            }
            chuisy.models.OwnedModel.prototype.save.call(this, attributes, options);
            this.set("friends", friends);
        },
        getTimeText: function() {
            return timeToText(this.get("time"));
        },
        setLiked: function(liked) {
            var activeUser = chuisy.accounts.getActiveUser();

            if (!activeUser || !activeUser.isAuthenticated()) {
                console.error("There has to be an active authenticated user to perform this action!");
                return;
            }

            this.set("liked", liked);
            this.set("likes_count", this.get("likes_count") + (liked ? 1 : -1));

            var options = {
                url: _.result(this, "url") + "/like/",
                data: {like: liked},
                type: "POST",
                contentType: "application/json"
            };
            Backbone.Tastypie.addAuthentication("create", this, options);
            Backbone.ajax(options);
        },
        like: function() {
            this.setLiked(true);
        },
        unlike: function() {
            this.setLiked(false);
        },
        toggleLike: function() {
            this.setLiked(!this.get("liked"));
        }
    });

    chuisy.models.Like = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/like/"
    });

    chuisy.models.FollowingRelation = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/followingrelation/"
    });

    chuisy.models.Place = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/place/"
    });

    chuisy.models.Notification = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/notification/",
        save: function(attributes, options) {
            attributes = attributes || {};
            var actor = _.clone(this.get("actor"));
            if (actor.resource_uri && (!(this.collection && this.collection.localStorage) || options && options.remote)) {
                attributes.actor = actor.resource_uri;
            }
            chuisy.models.OwnedModel.prototype.save.call(this, attributes, options);
            this.set("actor", actor);
        }
    });

    chuisy.models.Device = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/device/"
    });

    chuisy.models.Profile = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/profile/"
    });

    chuisy.models.Gift = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/gift/"
    });

    chuisy.models.SearchableCollection = Backbone.Tastypie.Collection.extend({
        fetch: function(options) {
            if (options && options.searchQuery) {
                this.searchQuery = options.searchQuery;
            }

            if (this.searchQuery) {
                var url = _.result(this, "url") + "search/";
                options = options || {};
                options.url = url;
                options.data = options.data || {};
                options.data.q = this.searchQuery;
            }

            Backbone.Tastypie.Collection.prototype.fetch.call(this, options);
        }
    });

    chuisy.models.UserCollection = chuisy.models.SearchableCollection.extend({
        model: chuisy.models.User,
        url: chuisy.apiRoot + chuisy.version + "/user/"
    });

    chuisy.models.Accounts = chuisy.models.UserCollection.extend({
        localStorage: new Backbone.LocalStorage("accounts"),
        setActiveUser: function(model) {
            localStorage.setItem("accounts_active", model.id);
            this.trigger("change");
        },
        getActiveUser: function() {
            return this.get(localStorage.getItem("accounts_active"));
        }
    });

    chuisy.models.ChuCollection = chuisy.models.SearchableCollection.extend({
        model: chuisy.models.Chu,
        url: chuisy.apiRoot + chuisy.version + "/chu/"
    });

    chuisy.models.Feed = chuisy.models.ChuCollection.extend({
        url: chuisy.apiRoot + chuisy.version + "/chu/feed/"
    });

    chuisy.models.Closet = chuisy.models.ChuCollection.extend({
        filters: function() {
            var user = chuisy.accounts.getActiveUser();
            if (user && user.isAuthenticated()) {
                return {
                    user: user.id
                };
            } else {
                return {};
            }
        }
    });

    chuisy.models.Notifications = Backbone.Tastypie.Collection.extend({
        model: chuisy.models.Notification,
        url: chuisy.apiRoot + chuisy.version + "/notification/",
        seen: function(options) {
            if (this.length) {
                options = options || {};
                options.url = _.result(this, "url") + "seen/";
                options.data = options.data || {};
                options.data.latest = this.at(0).get("time");
                this.each(function(el) {
                    el.set("seen", true);
                });
                Backbone.Tastypie.addAuthentication("read", this, options);
                Backbone.ajax(options);
            }
            this.trigger("reset");
        },
        getUnseenCount: function() {
            return this.filter(function(el) {
                return !el.get("seen");
            }).length;
        },
        getUnreadCount: function() {
            return this.filter(function(el) {
                return !el.get("read");
            }).length;
        }
    });


    chuisy.accounts = new chuisy.models.Accounts();
    chuisy.closet = new chuisy.models.Closet();
    chuisy.feed = new chuisy.models.Feed();
    chuisy.notifications = new chuisy.models.Notifications();

})(window.$, window._, window.Backbone, window.enyo);