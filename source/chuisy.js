(function($, _, Backbone, enyo) {
    chuisy = {
        apiRoot: "http://127.0.0.1:8000/api/",
        // apiRoot: "http://chuisy-staging.herokuapp.com/api/",
        // apiRoot: "http://www.chuisy.com/api/",
        version: "v1",
        online: false,
        closetDir: "closet/",
        init: function() {
            chuisy.closet.fetch();
            chuisy.accounts.fetch();

            chuisy.accounts.on("change:active_user", chuisy.activeUserChanged);
            chuisy.accounts.trigger("change:active_user");

            chuisy.feed.fetch();
        },
        activeUserChanged: function() {
            var user = chuisy.accounts.getActiveUser();
            if (user && user.isAuthenticated()) {
                Backbone.Tastypie.authCredentials = {
                    username: user.get("username"),
                    apiKey: user.get("api_key")
                };

                chuisy.accounts.syncRecords();
                chuisy.accounts.startPolling(600000);
                user.friends.fetchAll();

                chuisy.closet.syncRecords();
                chuisy.closet.startPolling(60000);

                chuisy.notifications.fetch();
                chuisy.notifications.startPolling(60000);

                chuisy.gifts.fetch();
            } else {
                Backbone.Tastypie.authCredentials = {};
            }
        },
        setOnline: function(online) {
            var goneOnline = online && !chuisy.online;
            chuisy.online = online;
            if (goneOnline && chuisy.accounts.getActiveUser()) {
                chuisy.accounts.syncRecords();
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
                        success();
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

    var upload = function(source, target, fileKey, fileName, mimeType, success, failure, progress) {
        try {
            var options = new FileUploadOptions();
            options.fileKey = fileKey;
            options.fileName = fileName;
            options.mimeType = mimeType;

            var ft = new FileTransfer();
            ft.onprogress = function(event) {
                console.log("Upload progress: " + JSON.stringify(event));
                if (progress) {
                    progress(event);
                }
            };
            ft.upload(source, target, function(r) {
                console.log("upload successfull! " + JSON.stringify(r));
                if (success) {
                    success(r.response);
                }
            }, function(error) {
                console.error("File upload failed! " + error);
                if (failure) {
                    failure(error);
                }
            }, options);
        } catch (e) {
            console.error("Could not start file upload. " + e.message);
        }
    };

    var download = function(source, targetDir, targetFileName, success, failure) {
        try {
            getDir(targetDir, function(directory) {
                var target = directory.fullPath + "/" + targetFileName;
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

    var removeFile = function(url) {
        try {
            window.resolveLocalFileSystemURI(url, function(entry) {
                entry.remove(function() {
                    console.log("File removed successfully: " + entry.fullPath);
                }, function(error) {
                    console.error("Failed to remove file at " + entry.fullPath + ". " + error);
                });
            }, function(error) {
                console.error("Could not resolve url " + error);
            });
        } catch(e) {
            console.error("Failed to remove file at " + url + ". " + e);
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
        newRecordSynced: function(model, response, options) {
            var oldModel = new this.model({id: options.lid});
            this.localStorage.destroy(oldModel);
            this.mark(oldModel, "added", false);
        },
        destroyedRecordSynced: function(model, response) {
            this.mark(model, "destroyed", false);
        },
        syncRecords: function() {
            var added = this.getList("added");
            var changed = this.getList("changed");
            var destroyed = this.getList("destroyed");

            console.log("syncing records for collection " + this.localStorage.name + "...");
            console.log("added: " + JSON.stringify(added));
            console.log("changed: " + JSON.stringify(changed));
            console.log("destroyed: " + JSON.stringify(destroyed));

            for (var i=0; i<changed.length; i++) {
                var model = this.get(changed[i]);
                if (model && !this.isMarked(model, "added")) {
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
            moveFile(url, "avatars/", "avatar_" + new Date().getTime() + ".jpg", _.bind(function(newUrl) {
                this.save({localAvatar: newUrl}, {nosync: true});
                this.trigger("change:avatar", this);
                this.uploadAvatar();
                this.makeThumbnail();
            }, this));
        },
        uploadAvatar: function() {
            var uri = this.get("localAvatar");
            var target = encodeURI(_.result(this, "url") + "upload_avatar/" + Backbone.Tastypie.getAuthUrlParams());
            upload(uri, target, "image", uri.substr(uri.lastIndexOf('/')+1), "image/jpeg", _.bind(function(response) {
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
            this.set("friends", friends);
        },
        destroy: function() {
            if (this.get("localImage")) {
                removeFile(this.get("localImage"));
            }
            if (this.get("localThumbnail")) {
                removeFile(this.get("localThumbnail"));
            }
            return chuisy.models.OwnedModel.prototype.destroy.apply(this, arguments);
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
        changeImage: function(url, callback) {
            moveFile(url, chuisy.closetDir, new Date().getTime() + ".jpg", _.bind(function(path) {
                this.save({"localImage": path}, {nosync: true});
                this.trigger("image_changed", this);
                this.makeThumbnail();
                callback(path);
            }, this));
        },
        downloadImage: function() {
            download(this.get("image"), chuisy.closetDir, this.id + ".jpg", _.bind(function(path) {
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
            var target = encodeURI(_.result(this, "url") + "upload_image/" + Backbone.Tastypie.getAuthUrlParams());
            upload(uri, target, "image", uri.substr(uri.lastIndexOf('/')+1), "image/jpeg", _.bind(function(response) {
                this.save({"image": response}, {nosync: true});
                this.trigger("image_uploaded", this);
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
        urlRoot: chuisy.apiRoot + chuisy.version + "/profile/",
        toJSON: function() {
            var json = chuisy.models.OwnedModel.prototype.toJSON.apply(this, arguments);
            // delete json.avatar_thumbnail;
            return json;
        }
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
        url: function() {
            return chuisy.apiRoot + chuisy.version + "/user/set/" + this.pluck("id").join(";") + "/";
        },
        initialize: function() {
            chuisy.models.SyncableCollection.prototype.initialize.apply(this, arguments);
            this.listenTo(this, "change:avatar", function(model, options) {
                this.mark(model, "avatar_changed", true);
            });
            this.listenTo(this, "sync:avatar", function(model, response, options) {
                this.mark(model, "avatar_changed", false);
            });
        },
        syncRecords: function() {
            chuisy.models.SyncableCollection.prototype.syncRecords.apply(this, arguments);
            var avatar_changed = this.getList("avatar_changed");
            console.log("avatar_changed: " + JSON.stringify(avatar_changed));
            for (var i=0; i<avatar_changed.length; i++) {
                var model = this.get(avatar_changed[i]);
                if (model && !this.isMarked(model, "added")) {
                    model.uploadAvatar();
                }
            }
        },
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