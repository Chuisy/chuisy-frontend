(function($, _, Backbone, enyo) {
    chuisy = {
        apiRoot: "http://127.0.0.1:8000/api/",
        // apiUrl: "http://chuisy-staging.herokuapp.com/api/",
        // apiUrl: "http://www.chuisy.com/api/",
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
        getFriends: function(success) {
            Backbone.ajax(_.result(this, "url") + "/friends/", {
                dataType: "json",
                context: this,
                success: function(data) {
                    var friends = new chuisy.models.UserCollection(data.objects);
                    if (success) {
                        success(friends);
                    }
                },
                error: function(error) {
                    console.error(error);
                }
            });
        }
    });

    chuisy.models.Chu = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/chu/",
        getTimeText: function() {
            return timeToText(this.get("time"));
        }
    });

    chuisy.models.ChuComment = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/chucomment/",
        getTimeText: function() {
            return timeToText(this.get("time"));
        }
    });

    chuisy.models.Like = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/like/"
    });

    chuisy.models.FollowingRelation = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/followingrelation/"
    });

    chuisy.models.Place = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/place/"
    });

    chuisy.models.Notification = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/notification/"
    });

    chuisy.models.Device = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/device/"
    });

    chuisy.models.Profile = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/profile/"
    });

    chuisy.models.Gift = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/gift/"
    });

    chuisy.models.SearchableCollection = Backbone.Tastypie.Collection.extend({
        search: function(query, options) {
            var url = _.result(this, "url") + "search/";
            options = options || {};
            options.url = url;
            options.data = options.data || {};
            options.data.q = query;

            this.fetch(options);
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

    chuisy.accounts = new chuisy.models.Accounts();
    chuisy.closet = new chuisy.models.Closet();
    chuisy.feed = new chuisy.models.Feed();
})(window.$, window._, window.Backbone, window.enyo);