(function($, _, Backbone, enyo) {
    chuisy = {
        apiRoot: "http://127.0.0.1:8000/api/",
        // apiRoot: "http://chuisy-staging.herokuapp.com/api/",
        // apiRoot: "http://www.chuisy.com/api/",
        version: "v1",
        online: false,
        closetDir: "closet/",
        init: function() {
            chuisy.accounts.fetch();
            var user = chuisy.accounts.getActiveUser();
            if (user && user.isAuthenticated()) {
                Backbone.Tastypie.authCredentials = {
                    username: user.get("username"),
                    apiKey: user.get("api_key")
                };
                user.friends.fetchAll();
            }
            chuisy.feed.fetch();
            chuisy.closet.fetch();
            chuisy.notifications.fetch();
            chuisy.notifications.syncRecords();
            chuisy.notifications.startPolling(60000);
            chuisy.gifts.fetch();
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
                    },
                    error: failure
                });
                if (success) {
                    success();
                }
                // enyo.Signals.send("onSignInSuccess", {user: user});
            }, function() {
                // enyo.Signals.send("onSignInFail");
            });
        },
        signOut: function() {
            chuisy.accounts.getActiveUser().destroy();
            chuisy.accounts.setActiveUser(null);
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

    var download = function(source, target, success, failure) {
        try {
            var ft = new FileTransfer();
            var uri = encodeURI(source);

            ft.download(uri, target, function(entry) {
                console.log("Download complete: " + entry.fullPath);
                if (success) {
                    success("file://" + entry.fullPath);
                }
            }, function(error) {
                console.error("File download failed! " + error);
            });
        } catch (e) {
            console.error("Could not start file download. " + e);
        }
    };

    var getDir = function(relPath, success, failure) {
        try {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSys) {
                fileSys.root.getDirectory(relPath, {create:true, exclusive: false}, function(directory) {
                    if (success) {
                        success(directory);
                    }
                }, function(error) {
                    console.error("Could not get directory. " + error);
                });
            }, function(error) {
                console.error("Could not get file system. " + error);
            });
        } catch (e) {
            console.error("Could not get directory. " + e);
        }
    };

    var moveFile = function(source, targetDir, targetFileName, success, failure) {
        try {
            window.resolveLocalFileSystemURI(source, function(entry) {
                getDir(targetDir, function(directory) {
                    entry.copyTo(directory, targetFileName, function(entry) {
                        if (success) {
                            success("file://" + entry.fullPath);
                        }
                    }, function(error) {
                        console.error("Could not copy file. " + error);
                    });
                });
            }, function(error) {
                console.error("Could not resolve source uri. " + error);
            });
        } catch (e) {
            console.error("Could not resolve source uri. " + e);
        }
    };

    var saveImageFromData = function(data, relTargetPath, success, failure) {
        try {
            var baseData = data.replace(/^data:image\/(png|jpg);base64,/, "");
            window.plugins.imageResizer.storeImage(function(fullPath) {
                if (success) {
                    success("file://" + fullPath);
                }
            }, function(error) {
                console.error("Could not save image. " + error);
            }, baseData, {filename: relTargetPath});
        } catch(e) {
            console.error("Could not save image. " + e);
        }
    };

    chuisy.models = {};

    chuisy.models.SyncableCollection = Backbone.Tastypie.Collection.extend({
        initialize: function() {
            Backbone.Tastypie.Collection.prototype.initialize.apply(this, arguments);
            this.listenTo(this, "create add", function(model, collection, options) {
                if (!options || !options.remote) {
                    this.mark(model, "added", true);
                }
            });
            this.listenTo(this, "change", function(model, options) {
                if ((!options || !options.remote && !options.nosync) && model.id && this.get(model.id) && this.localStorage.find(model) && !this.isMarked(model, "added")) {
                    this.mark(model, "changed", true);
                }
            });
            this.listenTo(this, "destroy", function(model) {
                if (!this.isMarked(model, "added")) {
                    this.mark(model, "destroyed", true);
                }
                this.mark(model, "added", false);
                this.mark(model, "changed", false);
            });
            this.listenTo(this, "sync", function(model, response, options) {
                if (model instanceof Backbone.Model) {
                    model.save(null, {nosync: true});
                    this.mark(model, "added", false);
                    this.mark(model, "changed", false);
                } else if (model instanceof Backbone.Collection) {
                    model.each(function(model) {
                        model.save(null, {nosync: true});
                    });
                }
            });
        },
        getList: function(name) {
            var str = localStorage.getItem(this.localStorage.name + "_" + name);
            return str ? str.split(",") : [];
        },
        setList: function(name, ids) {
            localStorage.setItem(this.localStorage.name + "_" + name, ids.join(","));
        },
        mark: function(model, type, value) {
            if (model && model.id) {
                var ids = this.getList(type);
                if (value && !_.contains(ids, model.id)) {
                    ids.push(model.id);
                } else {
                    ids = _.without(ids, model.id);
                }
                this.setList(type, ids);
            }
        },
        isMarked: function(model, type) {
            return model.id && _.contains(this.getList(type), model.id) ? true : false;
        },
        update: function(models, options) {
            options = _.extend({add: true, merge: true, remove: true}, options);
            if (options.parse) {
                models = this.parse(models, options);
                options.parse = false;
            }
            models = models.filter(_.bind(function(model) {
                return !this.isMarked(model, "added") && !this.isMarked(model, "changed") && !this.isMarked(model, "destroyed");
            }, this));
            return Backbone.Tastypie.Collection.prototype.update.call(this, models, options);
        },
        newRecordSynced: function(model, respone, options) {
            var oldModel = new this.model({id: options.lid});
            this.localStorage.destroy(oldModel);
            this.mark(oldModel, "added", false);
        },
        destroyedRecordSynced: function(model, response) {
            if (response.status == 204) {
                this.mark(model, "destroyed", false);
            }
        },
        syncRecords: function() {
            this.fetch();
            var added = this.getList("added");
            var changed = this.getList("changed");
            var destroyed = this.getList("destroyed");

            for (var i=0; i<changed.length; i++) {
                var model = this.get(changed[i]);
                if (model) {
                    model.save(null, {remote: true});
                }
            }

            for (i=0; i<destroyed.length; i++) {
                var model = new this.model({id: destroyed[i]});
                model.destroy({remote: true, wait: true, complete: _.bind(this.destroyedRecordSynced, this, model)});
            }

            for (i=0; i<added.length; i++) {
                var model = this.get(added[i]);
                if (model) {
                    var lid = model.id;
                    model.id = null;
                    model.unset("id");
                    model.once("sync", this.newRecordSynced, this);
                    model.save(null, {remote: true, lid: lid});
                    model.id = lid;
                    model.set("id", lid);
                }
            }

            this.fetchAll({remote: true, update: true, add: true, remove: false, merge: true});
        },
        startPolling: function(interval, options) {
            this.pollInterval = setInterval(_.bind(function() {
                this.syncRecords();
            }, this), interval || 60000);
        }
    });

    chuisy.models.User = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/user/",
        authUrl: chuisy.apiRoot + chuisy.version + "/authenticate/",
        initialize: function(attributes, options) {
            Backbone.Tastypie.Model.prototype.initialize.call(this, attributes, options);
            this.profile = new chuisy.models.Profile(this.get("profile"));
            this.unset("profile");
            this.listenTo(this.profile, "change", function() {
                this.trigger("change change:profile");
            });
            this.followers = new chuisy.models.UserCollection([], {
                url: _.result(this, "url") + "followers/"
            });
            this.following = new chuisy.models.UserCollection([], {
                url: _.result(this, "url") + "following/"
            });
            this.friends = new chuisy.models.UserCollection([], {
                url: _.result(this, "url") + "friends/"
            });
            this.chus = new chuisy.models.ChuCollection([], {
                filters: {
                    user: this.id
                }
            });
        },
        parse: function(response) {
            if (this.profile) {
                this.profile.set(response.profile);
                delete response.profile;
            }
            return response;
        },
        toJSON: function() {
            var userJSON = Backbone.Tastypie.Model.prototype.toJSON.apply(this, arguments);
            userJSON.profile = this.profile.toJSON();
            return userJSON;
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
        changeAvatar: function(uri) {
            this.save({local_avatar: uri});
            this.uploadAvatar();
        },
        uploadAvatar: function() {
            var target = encodeURI(_.result(this, "url") + "upload_avatar/?username=" +
                this.authCredentials.username + "&api_key=" + this.authCredentials.api_key);
            upload(this.get("local_avatar"), target, "image", uri.substr(uri.lastIndexOf('/')+1), "image/jpeg", function(response) {
                this.profile.set("avatar", response);
                this.save();
                this.trigger("sync:avatar");
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
                url: _.result(this, "url") + "follow/",
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
                for (var i=0; i<models.length; i++) {
                    var el=models[i];
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
                url: _.result(this, "url") + "like/",
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
        },
        setLocalImage: function(url) {
            moveFile(url, chuisy.closetDir, new Date().getTime() + ".jpg", _.bind(function(path) {
                this.save({"localImage": path}, {nosync: true});
                this.makeThumbnail();
            }, this));
        },
        makeThumbnail: function() {
            var image = this.get("localImage");
            if (!image) {
                console.error("Can't make thumbnail because there is no local image.");
                return;
            }
            createThumbnail(image, 100, 100, _.bind(function(imageData) {
                var fileName = "thumb_" + image.substring(image.lastIndexOf("/")+1);
                saveImageFromData(imageData, chuisy.closetDir + fileName, _.bind(function(path) {
                    this.save({localThumbnail: path}, {nosync: true});
                }, this));
            }, this));
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
        urlRoot: chuisy.apiRoot + chuisy.version + "/notification/"
        // save: function(attributes, options) {
        //     attributes = attributes || {};
        //     var actor = _.clone(this.get("actor"));
        //     if (actor.resource_uri && (!(this.collection && this.collection.localStorage) || options && options.remote)) {
        //         attributes.actor = actor.resource_uri;
        //     }
        //     chuisy.models.OwnedModel.prototype.save.call(this, attributes, options);
        //     this.set("actor", actor);
        // }
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

    chuisy.models.Accounts = chuisy.models.SyncableCollection.extend({
        model: chuisy.models.User,
        localStorage: new Backbone.LocalStorage("accounts"),
        setActiveUser: function(model) {
            localStorage.setItem("accounts_active", model && model.id);
            this.trigger("change:active_user");
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

    chuisy.models.Closet = chuisy.models.SyncableCollection.extend({
        model: chuisy.models.Chu,
        url: chuisy.apiRoot + chuisy.version + "/chu/",
        localStorage: new Backbone.LocalStorage("closet"),
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

    chuisy.models.Notifications = chuisy.models.SyncableCollection.extend({
        model: chuisy.models.Notification,
        url: chuisy.apiRoot + chuisy.version + "/notification/",
        localStorage: new Backbone.LocalStorage("notifications"),
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

    chuisy.models.GiftsCollection = Backbone.Tastypie.Collection.extend({
        model: chuisy.models.Gift,
        url: chuisy.apiRoot + chuisy.version + "/gift/"
    });


    chuisy.accounts = new chuisy.models.Accounts();
    chuisy.closet = new chuisy.models.Closet();
    chuisy.feed = new chuisy.models.Feed();
    chuisy.notifications = new chuisy.models.Notifications();
    chuisy.gifts = new chuisy.models.GiftsCollection();

})(window.$, window._, window.Backbone, window.enyo);