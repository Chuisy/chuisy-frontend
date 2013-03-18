(function($, _, Backbone, enyo) {
    chuisy = {
        // apiRoot: "http://127.0.0.1:8000/api/",
        // apiRoot: "http://chuisy-staging.herokuapp.com/api/",
        apiRoot: "http://www.chuisy.com/api/",
        version: "v1",
        online: false,
        closetDir: "closet/",
        init: function(lightweight) {
            chuisy.accounts.fetch();

            chuisy.accounts.on("change:active_user", _.bind(chuisy.activeUserChanged, this, lightweight));
            chuisy.accounts.trigger("change:active_user");

            if (!lightweight) {
                chuisy.closet.fetch();

                chuisy.feed.fetch();
                chuisy.feed.fetch({remote: true, data: {limit: 30}});

                chuisy.venues.fetch();
            }
        },
        activeUserChanged: function(lightweight) {
            var user = chuisy.accounts.getActiveUser();
            if (user && user.isAuthenticated()) {
                Backbone.Tastypie.authCredentials = {
                    username: user.get("username"),
                    apiKey: user.get("api_key")
                };

                chuisy.accounts.syncActiveUser();

                if (!lightweight) {
                    setInterval(function() {
                        chuisy.accounts.syncActiveUser();
                    }, 60000);
                    user.friends.fetchAll();

                    chuisy.closet.syncRecords();
                    chuisy.closet.startPolling(60000);

                    chuisy.cards.fetch();

                    chuisy.notifications.fetch();
                    chuisy.notifications.startPolling(60000);
                }
            } else {
                Backbone.Tastypie.authCredentials = {};
                chuisy.accounts.stopPolling();
                chuisy.closet.stopPolling();
                chuisy.notifications.stopPolling();
            }
        },
        setOnline: function(online) {
            var goneOnline = online && !chuisy.online;
            chuisy.online = online;
            if (goneOnline && chuisy.accounts.getActiveUser() && chuisy.accounts.getActiveUser().isAuthenticated()) {
                chuisy.accounts.syncActiveUser();
                chuisy.closet.syncRecords();
                chuisy.notifications.fetch();
            }
        },
        /**
            Validate user credentials and obtain api key and profile data
        */
        signIn: function(fb_access_token, success, failure) {
            var user = new chuisy.models.User();
            user.authenticate(fb_access_token, function() {
                user.fetch({remote: true, success: function() {
                    chuisy.accounts.add(user, {nosync: true});
                    user.save(null, {nosync: true});
                    chuisy.accounts.setActiveUser(user);
                    if (success) {
                        success(user);
                    }
                }, error: failure});
            }, function() {
                if (failure) {
                    failure();
                }
            });
        },
        signOut: function() {
            chuisy.accounts.getActiveUser().destroy({nosync: true});
            chuisy.accounts.setActiveUser(null);
        }
    };

    chuisy.models = {};

    chuisy.models.SyncableCollection = Backbone.Tastypie.Collection.extend({
        initialize: function() {
            Backbone.Tastypie.Collection.prototype.initialize.apply(this, arguments);
            this.listenTo(this, "create add", function(model, collection, options) {
                if (!options || !options.nosync && !options.remote) {
                    this.mark(model, "added", true);
                }
            });
            this.listenTo(this, "change", function(model, options) {
                if ((!options || !options.remote && !options.nosync) && model && model.id && this.get(model.id) && this.localStorage.find(model) && !this.isMarked(model, "added")) {
                    this.mark(model, "changed", true);
                }
            });
            this.listenTo(this, "destroy", function(model, collection, options) {
                if (!options || !options.nosync && !this.isMarked(model, "added")) {
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
                    model.each(function(each) {
                        each.save(null, {nosync: true});
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
                if (value && !_.contains(ids, model.id.toString())) {
                    ids.push(model.id);
                } else if (!value) {
                    ids = _.without(ids, model.id.toString());
                }
                this.setList(type, ids);
            }
        },
        isMarked: function(model, type) {
            return model.id && _.contains(this.getList(type), model.id.toString()) ? true : false;
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
        newRecordSynced: function(model, response, options) {
            var oldModel = new this.model({id: options.lid});
            this.localStorage.destroy(oldModel);
            this.mark(oldModel, "added", false);
            if (model.get("syncStatus") == "posting") {
                model.save({syncStatus: "synced"}, {nosync: true, silent: true});
                model.trigger("change:syncStatus", model);
            }
        },
        destroyedRecordSynced: function(model, response) {
            this.mark(model, "destroyed", false);
        },
        syncErrorHandler: function(model, request, options) {
            console.log("Model failed to sync. id: " + model.id + ", status code: " + request.status + ", response text: " + request.responseText);
            model.save({syncStatus: "postFailed"}, {nosync: true, silent: true});
            model.trigger("change:syncStatus", model);
        },
        syncRecords: function() {
            var added = this.getList("added");
            var changed = this.getList("changed");
            var destroyed = this.getList("destroyed");

            console.log("syncing records for collection " + this.localStorage.name + "...");
            console.log("added: " + JSON.stringify(added));
            console.log("changed: " + JSON.stringify(changed));
            console.log("destroyed: " + JSON.stringify(destroyed));

            this.fetchAll({remote: true, update: true, add: true, remove: false, merge: true});

            for (var i=0; i<changed.length; i++) {
                var model = this.get(changed[i]);
                if (model && !this.isMarked(model, "added")) {
                    model.save(null, {remote: true, nosync: true, silent: true});
                }
            }

            for (i=0; i<destroyed.length; i++) {
                var model = new this.model({id: destroyed[i]});
                model.destroy({remote: true, wait: true, complete: _.bind(this.destroyedRecordSynced, this, model)});
            }

            for (i=0; i<added.length; i++) {
                var model = this.get(added[i]);
                if (model) {
                    model.set({syncStatus: "posting"}, {nosync: true, silent: true});
                    model.trigger("change:syncStatus", model);
                    var lid = model.id;
                    model.id = null;
                    model.unset("id");
                    model.once("sync", this.newRecordSynced, this);
                    model.save(null, {remote: true, lid: lid, error: this.syncErrorHandler});
                    model.id = lid;
                    model.set("id", lid);
                }
            }
        },
        startPolling: function(interval, options) {
            this.pollInterval = setInterval(_.bind(function() {
                this.syncRecords();
            }, this), interval || 60000);
        }
    });

    chuisy.models.FbFriend = Backbone.Model.extend({
        urlRoot: "https://graph.facebook.com/",
        getAvatar: function(width, height) {
            return _.result(this, "url") + "/picture/?width=" + (width || 50) + "&height=" + (height || 50);
        }
    });

    chuisy.models.FbFriendsCollection = Backbone.Collection.extend({
        model: chuisy.models.FbFriend,
        initialize: function(models, options) {
            Backbone.Collection.prototype.initialize.call(this, models, options);
            this.paging = {};
            this.url = options && options.url || this.url;
        },
        parse: function(response) {
            this.paging = response && response.paging;
            return response.data;
        },
        fetchNext: function() {
            this.fetch({
                update: true,
                add: true,
                remove: false,
                url: this.paging && this.paging.next
            });
        },
        hasNextPage: function() {
            return this.paging && this.paging.next;
        },
        fetchAll: function(options) {
            options = options || {};
            var success = options.success;
            options.success = _.bind(function(collection, response) {
                if (this.hasNextPage()) {
                    this.fetchNext(options);
                } else if (success) {
                    success(collection, response, options);
                }
            }, this);
            this.fetch(options);
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
                this.trigger("change change:profile", this);
            });
            this.followers = new chuisy.models.UserCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "followers/";
                }, this)
            });
            this.following = new chuisy.models.UserCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "following/";
                }, this)
            });
            this.friends = new chuisy.models.UserCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "friends/";
                }, this)
            });
            this.chus = new chuisy.models.ChuCollection([], {
                filters: _.bind(function(user) {
                    return {user: this.id};
                }, this)
            });
            this.fbFriends = new chuisy.models.FbFriendsCollection([], {
                url: _.bind(function() {
                    return "https://graph.facebook.com/me/friends/?access_token=" + this.get("fb_access_token");
                }, this)
            });
        },
        parse: function(response) {
            if (this.profile) {
                this.profile.set(response.profile, {nosync: true});
                delete response.profile;
            }
            return response;
        },
        toJSON: function() {
            var json = Backbone.Tastypie.Model.prototype.toJSON.apply(this, arguments);
            json.profile = this.profile.toJSON();
            return json;
        },
        // save: function(attributes, options) {
        //     attributes = attributes || {};
        //     if (!(this.collection && this.collection.localStorage) || options && options.remote) {
        //         this.profile.save(null, {silent: true, success: _.bind(function() {
        //             console.log("profile synced");
        //             attributes.profile = this.profile.get("resource_uri");
        //             Backbone.Tastypie.Model.prototype.save.call(this, attributes, options);
        //         }, this)});
        //     } else {
        //         attributes.profile = this.profile.toJSON();
        //         Backbone.Tastypie.Model.prototype.save.call(this, attributes, options);
        //     }
        // },
        authenticate: function(fbAccessToken, success, failure) {
            this.set("fb_access_token", fbAccessToken);
            Backbone.ajax(this.authUrl, {
                data: {fb_access_token: fbAccessToken},
                dataType: "json",
                context: this,
                success: function(data) {
                    this.set("username", data.username);
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
        changeAvatar: function(url) {
            fsShortcuts.moveFile(url, "avatars/", "avatar_" + new Date().getTime() + ".jpg", _.bind(function(newUrl) {
                this.save({localAvatar: newUrl}, {nosync: true});
                this.trigger("change:avatar", this);
                this.uploadAvatar();
                this.makeThumbnail();
            }, this));
        },
        uploadAvatar: function() {
            var uri = this.get("localAvatar");
            var target = encodeURI(_.result(this, "url") + "upload_avatar/" + Backbone.Tastypie.getAuthUrlParams());
            fsShortcuts.upload(uri, target, "image", uri.substr(uri.lastIndexOf('/')+1), "image/jpeg", _.bind(function(response) {
                this.profile.set("avatar", response);
                this.save(null, {nosync: true});
                this.trigger("sync:avatar", this);
                this.trigger("change", this, {nosync: true});
            }, this));
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
            return util.timeToText(this.get("time"));
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
            this.comments = new chuisy.models.ChuCommentCollection([], {
                chu: this,
                comparator: function(model) {
                    return new Date(model.get("time"));
                }
            });
            this.likes = new chuisy.models.UserCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "likes/";
                }, this)
            });

            this.listenTo(this, "sync", function(model, response, request) {
                if (request && request.xhr.status == 201 && this.get("localImage")) {
                    this.trigger("image_changed", this);
                    this.uploadImage();
                }
            });
        },
        save: function(attributes, options) {
            attributes = attributes || {};
            var friends = attributes.friends || _.clone(this.get("friends"));
            if (!(this.collection && this.collection.localStorage) || options && options.remote) {
                attributes.friends = _.pluck(friends, "resource_uri");
            }
            chuisy.models.OwnedModel.prototype.save.call(this, attributes, options);
            this.set("friends", friends, {silent: true});
        },
        destroy: function() {
            if (this.get("localImage")) {
                fsShortcuts.removeFile(this.get("localImage"));
            }
            if (this.get("localThumbnail")) {
                fsShortcuts.removeFile(this.get("localThumbnail"));
            }
            return chuisy.models.OwnedModel.prototype.destroy.apply(this, arguments);
        },
        getTimeText: function() {
            return util.timeToText(this.get("time"));
        },
        setLiked: function(liked) {
            var activeUser = chuisy.accounts.getActiveUser();

            if (!activeUser || !activeUser.isAuthenticated()) {
                console.error("There has to be an active authenticated user to perform this action!");
                return;
            }

            if (liked) {
                this.likes.unshift(activeUser);
            } else {
                this.likes.remove(activeUser);
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
        changeImage: function(url, callback) {
            fsShortcuts.moveFile(url, chuisy.closetDir, new Date().getTime() + ".jpg", _.bind(function(path) {
                this.save({"localImage": path}, {nosync: true});
                this.trigger("image_changed", this);
                this.makeThumbnail();
                callback(path);
            }, this), function() {
                callback(null);
            });
        },
        downloadImage: function() {
            fsShortcuts.download(this.get("image"), chuisy.closetDir, this.id + ".jpg", _.bind(function(path) {
                this.save({"localImage": path}, {nosync: true});
                this.makeThumbnail();
            }, this));
        },
        uploadImage: function() {
            var uri = this.get("localImage");
            if (!uri) {
                console.warn("No local image to upload!");
                return;
            }
            this.set({syncStatus: "uploading"}, {nosync: true, silent: true});
            this.trigger("change:syncStatus", this);
            var target = encodeURI(_.result(this, "url") + "upload_image/" + Backbone.Tastypie.getAuthUrlParams());
            fsShortcuts.upload(uri, target, "image", uri.substr(uri.lastIndexOf('/')+1), "image/jpeg", _.bind(function(response) {
                this.save({"image": response}, {nosync: true});
                this.trigger("image_uploaded", this);
                this.save({syncStatus: "synced"}, {nosync: true, silent: true});
                this.trigger("change:syncStatus", this);
            }, this), _.bind(function(error) {
                console.log("Failed to upload image. id: " + this.id + ", error: " + error);
                this.save({syncStatus: "uploadFailed"}, {nosync: true, silent: true});
                this.trigger("change:syncStatus", this);
            }, this));
        },
        makeThumbnail: function() {
            var image = this.get("localImage");
            if (!image) {
                console.error("Can't make thumbnail because there is no local image.");
                return;
            }
            util.createThumbnail(image, 200, 200, _.bind(function(imageData) {
                var fileName = "thumb_" + image.substring(image.lastIndexOf("/")+1);
                fsShortcuts.saveImageFromData(imageData, chuisy.closetDir + fileName, _.bind(function(path) {
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

    chuisy.models.Notification = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/notification/",
        save: function(attributes, options) {
            attributes = attributes || {};
            var actor = _.clone(this.get("actor"));
            if (actor && actor.resource_uri && (!(this.collection && this.collection.localStorage) || options && options.remote)) {
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
        urlRoot: chuisy.apiRoot + chuisy.version + "/profile/",
        toJSON: function() {
            var json = chuisy.models.OwnedModel.prototype.toJSON.apply(this, arguments);
            delete json.avatar_thumbnail;
            return json;
        }
    });

    chuisy.models.Card = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/card/"
    });

    chuisy.models.Coupon = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/coupon/",
        redeem: function(options) {
            options = options || {};
            options.url = _.result(this, "url") + "redeem/";
            var success = options.success;
            options.success = _.bind(function() {
                this.save("redeemed", true);
                if (success) {
                    success();
                }
            }, this);
            Backbone.Tastypie.addAuthentication("read", this, options);
            Backbone.ajax(options);
        }
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
        url: chuisy.apiRoot + chuisy.version + "/user/",
        localStorage: new Backbone.LocalStorage("accounts"),
        initialize: function() {
            chuisy.models.SyncableCollection.prototype.initialize.apply(this, arguments);
            this.listenTo(this, "change:avatar", function(model, options) {
                this.mark(model, "avatar_changed", true);
            });
            this.listenTo(this, "sync:avatar", function(model, response, options) {
                this.mark(model, "avatar_changed", false);
            });
        },
        setActiveUser: function(model) {
            localStorage.setItem("accounts_active", model && model.id);
            this.trigger("change:active_user");
        },
        getActiveUser: function() {
            return this.get(localStorage.getItem("accounts_active"));
        },
        syncActiveUser: function() {
            var user = this.getActiveUser();

            if (user) {
                if (!this.isMarked(user, "changed") && !this.isMarked(user, "avatar_changed")) {
                    user.fetch({remote: true});
                }
                if (this.isMarked(user, "changed")) {
                    user.save(null, {remote: true, nosync: true});
                }
                if (this.isMarked(user, "avatar_changed")) {
                    user.uploadAvatar();
                }
            }
        }
    });

    chuisy.models.ChuCollection = chuisy.models.SearchableCollection.extend({
        model: chuisy.models.Chu,
        url: chuisy.apiRoot + chuisy.version + "/chu/"
    });

    chuisy.models.Feed = chuisy.models.ChuCollection.extend({
        url: chuisy.apiRoot + chuisy.version + "/chu/feed/",
        localStorage: new Backbone.LocalStorage("feed"),
        reset: function(models, options) {
            if (!options.remote) {
                return chuisy.models.ChuCollection.prototype.reset.call(this, models, options);
            }

            this.each(function(model) {
                this.localStorage.destroy(model);
            }, this);
            chuisy.models.ChuCollection.prototype.reset.call(this, models, options);
            this.each(function(model) {
                this.localStorage.create(model);
            }, this);
        }
    });

    chuisy.models.Closet = chuisy.models.SyncableCollection.extend({
        model: chuisy.models.Chu,
        url: chuisy.apiRoot + chuisy.version + "/chu/",
        localStorage: new Backbone.LocalStorage("closet"),
        comparator: function(model) {
            return -(new Date(model.get("time")));
        },
        initialize: function() {
            chuisy.models.SyncableCollection.prototype.initialize.apply(this, arguments);
            this.listenTo(this, "image_changed", function(model, options) {
                if (!this.isMarked(model, "added")) {
                    this.mark(model, "image_changed", true);
                }
            });
            this.listenTo(this, "image_uploaded", function(model, response, options) {
                this.mark(model, "image_changed", false);
            });
            this.listenTo(this, "sync", function(model, response, options) {
                if (model instanceof chuisy.models.Chu) {
                    if (model.get("image") && !model.get("localImage")) {
                        model.downloadImage();
                    }
                } else if (model instanceof chuisy.models.Closet) {
                    model.each(function(each) {
                        if (each.get("image") && !each.get("localImage")) {
                            each.downloadImage();
                        }
                    });
                }
            });
        },
        filters: function() {
            var user = chuisy.accounts.getActiveUser();
            if (user && user.isAuthenticated()) {
                return {
                    user: user.id
                };
            } else {
                return {
                    user: 0
                };
            }
        },
        syncRecords: function() {
            chuisy.models.SyncableCollection.prototype.syncRecords.apply(this, arguments);
            var image_changed = this.getList("image_changed");
            console.log("image_changed: " + JSON.stringify(image_changed));
            for (var i=0; i<image_changed.length; i++) {
                var model = this.get(image_changed[i]);
                if (model && !this.isMarked(model, "added")) {
                    model.uploadImage();
                }
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
            this.meta = this.meta || {};
            this.meta.unseen_count = 0;
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

    chuisy.models.CardCollection = Backbone.Tastypie.Collection.extend({
        model: chuisy.models.Card,
        url: chuisy.apiRoot + chuisy.version + "/card/",
        sizes: {
                "small": [1, 1],
                "wide": [2, 1],
                "tall": [1, 2],
                "big": [2, 2],
                "panorama": [3, 1]
        },
        findNextItemWithMaxWidth: function(from, width) {
            for (var i=from; i<this.length; i++) {
                if (this.sizes[this.models[i].get("format")][0] <= width) {
                    return i;
                }
            }
        },
        compress: function(colCount) {
            colCount = colCount || 3;
            var i = 0;

            while (i < this.length) {
                var val = 0, j = i;
                while (val < colCount && j < this.length) {
                    var model = this.models[j];
                    var format = model.get("format");
                    val += this.sizes[format][0];
                    if (val > colCount) {
                        k = this.findNextItemWithMaxWidth(j+1, val-colCount);
                        if (k) {
                            this.models[j] = this.models[k];
                            this.models[k] = model;
                            val = val - this.sizes[this.models[k].get("format")][0] + this.sizes[this.models[j].get("format")][0];
                        }
                    }
                    j++;
                }
                i = j;
            }
        }
    });

    /*
        Converts degrees to radians
    */
    var rad = function(deg) {
        return deg * Math.PI / 180;
    };

    /*
        Calculates the distance (m) between to geographical coordinates (lat and lng in degrees)
    */
    var distance = function(lat, lng, lat0, lng0) {
        var R = 6371000; // m
        lat0 = rad(lat0);
        lng0 = rad(lng0);
        lat = rad(lat);
        lng = rad(lng);
        var dLat = (lat-lat0);
        var dLon = (lng-lng0);

        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat) * Math.cos(lat0);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d;
    };

    chuisy.models.Venue = Backbone.Tastypie.Model.extend({
        urlRoot: "https://api.foursquare.com/v2/venues/",
        /*
            Calculates the distance to a coordinate in meters
        */
        distanceTo: function(lat, lng) {
            return distance(lat, lng, this.get("location").lat, this.get("location").lng);
        },
        /*
            Returns a plain object with the structure of a Chuisy Location object
        */
        toLocJSON: function() {
            return {
                name: this.get("name"),
                latitude: this.get("location").lat,
                longitude: this.get("location").lng,
                address: this.get("location").address,
                zip_code: this.get("location").postalCode,
                city: this.get("location").city,
                country: this.get("location").cc,
                foursquare_id: this.id
            };
        }
    });

    chuisy.models.Venues = Backbone.Collection.extend({
        model: chuisy.models.Venue,
        url: "https://api.foursquare.com/v2/venues/search",
        localStorage: new Backbone.LocalStorage("locations"),
        initialize: function() {
            Backbone.Collection.prototype.initialize.apply(this, arguments);
            this.listenTo(this, "sync", function(model, response, options) {
                if (model instanceof Backbone.Model) {
                    model.save();
                } else if (model instanceof Backbone.Collection) {
                    model.each(function(each) {
                        each.save();
                    });
                }
            });
        },
        parse: function(response) {
            return response && response.response && response.response.venues || response;
        },
        fetch: function(options) {
            options = options || {};
            if (options.remote) {
                if (!options.latitude || !options.longitude) {
                    console.error("Latitude and longitude hand to be specified in the options!");
                    return;
                }
                options.update = true;
                options.add = true;
                options.remove = false;
                options.merge = true;
                options.data = options.data || {};
                _.extend(options.data, {
                    intent: "checkin",
                    ll: options.latitude + "," + options.longitude,
                    radius: options.radius || 100,
                    client_id: "0XVNZDCHBFFTGKP1YGHRAG3I154DOT0QGATA120CQ3KQFIYU",
                    client_secret: "QPM5WVRLV0OEDLJK3NWV01F1OLDQVVMWS25PJJTFDLE02GOL",
                    v: "20121024",
                    limit: 50,
                    categoryId: [
                        // Clothing Store
                        "4bf58dd8d48988d103951735",
                        // Bridal Shop
                        "4bf58dd8d48988d11a951735",
                        // Jewelry Store
                        "4bf58dd8d48988d111951735"
                    ].join(",")
                });
            }

            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    });

    chuisy.accounts = new chuisy.models.Accounts();
    chuisy.closet = new chuisy.models.Closet();
    chuisy.feed = new chuisy.models.Feed();
    chuisy.notifications = new chuisy.models.Notifications();
    chuisy.venues = new chuisy.models.Venues();
    chuisy.cards = new chuisy.models.CardCollection();

})(window.$, window._, window.Backbone, window.enyo);
