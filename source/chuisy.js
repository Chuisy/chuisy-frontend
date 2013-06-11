(function($, _, Backbone, enyo) {
    chuisy = {
        // apiRoot: "http://127.0.0.1:8000/api/",
        // apiRoot: "http://chuisy-staging.herokuapp.com/api/",
        apiRoot: "http://www.chuisy.com/api/",
        version: "v1",
        online: false,
        // Directory where chu images are stored in locally
        closetDir: "closet/",
        /*
            Does some initizializing like loading accounts. Pass true to skip loading closet, feed etc.
        */
        init: function(lightweight) {
            chuisy.accounts.fetch();

            chuisy.accounts.on("change:active_user", _.bind(chuisy.activeUserChanged, this, lightweight));
            chuisy.accounts.trigger("change:active_user");

            if (!lightweight) {
                chuisy.notices.fetch({data: {
                    language: navigator.language.split("-")[0]
                }});

                chuisy.closet.fetch();
                chuisy.closet.checkLocalFiles();

                chuisy.feed.fetch();
                chuisy.feed.fetch({remote: true, data: {limit: 20}});

                chuisy.venues.fetch();
            }
        },
        /*
            Called when the active user changes, i.e. when a user signs in or the active user is loaded on intilization;
        */
        activeUserChanged: function(lightweight) {
            var user = chuisy.accounts.getActiveUser();
            if (user && user.isAuthenticated()) {
                // Set the auth credentials for the api; From now on, all calls to the Tastypie api will be authenticated
                Backbone.Tastypie.authCredentials = {
                    username: user.get("username"),
                    apiKey: user.get("api_key")
                };

                chuisy.accounts.syncActiveUser();

                if (!lightweight) {
                    // Regularly synchronize changes to the user information
                    setInterval(function() {
                        chuisy.accounts.syncActiveUser();
                    }, 60000);

                    // Fetch the active users friends
                    user.friends.fetchAll();

                    // Regularly synchronize the closet
                    chuisy.closet.syncRecords();
                    chuisy.closet.startPolling(60000);

                    // Fetch cards for goodies view
                    chuisy.cards.fetch();

                    // Regularly poll for new notifications
                    chuisy.notifications.fetch();
                    chuisy.notifications.startPolling(60000);
                }
            } else {
                // Unset auth credentials
                Backbone.Tastypie.authCredentials = {};
                chuisy.accounts.stopPolling();
                chuisy.closet.stopPolling();
                chuisy.notifications.stopPolling();
                chuisy.notifications.reset();
                chuisy.cards.reset();
            }
        },
        /*
            Called to make the chuiy object aware if a internet collection is available or not. Performs some synchronization tasks
        */
        setOnline: function(online) {
            var goneOnline = online && !chuisy.online;
            chuisy.online = online;
            if (goneOnline && chuisy.accounts.getActiveUser() && chuisy.accounts.getActiveUser().isAuthenticated()) {
                // We have gone from offline to online and there is an active and authenticated user. Lets do some synching!
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
                // We have the id and auth credentials now. Let's fetch the rest of the user data
                user.fetch({remote: true, success: function() {
                    // Add the user to the accounts collection, make him the active user and store him locally
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
        /*
            Destroy the active user object locally and set the active user to null
        */
        signOut: function() {
            if (chuisy.accounts.getActiveUser()) {
                chuisy.accounts.getActiveUser().destroy({nosync: true});
            }
            chuisy.accounts.setActiveUser(null);
        },
        createInvites: function(requestId, recipientIds) {
            var objects = [];
            for (var i=0; i<recipientIds.length; i++) {
                objects.push({
                    request_id: requestId,
                    recipient_id: recipientIds[i]
                });
            }

            var options = {
                url: chuisy.apiRoot + chuisy.version + "/invite/",
                method: "patch",
                contentType: "application/json",
                data: JSON.stringify({
                    objects: objects
                })
            };
            Backbone.Tastypie.addAuthentication(options);
            Backbone.ajax(options);
        }
    };

    /*
        CHUISY MODELS
    */

    chuisy.models = {};

    /*
        A collection that, additionally to fetching data from the server, can store objects locally and synchronize offline data with the server;
        In general, if any action like save, fetch or destroy is called on the collection or a model in the collection it is by default performed
        against the local storage. Changes like adding, destroying or modifying objects are stored internally and are synced when _syncRecords_ is called.
        Pass nosync: true in the options to prevent this. Pass remote: true in the options object to explicitly perform changes directly towards the
        remote server.
    */
    chuisy.models.SyncableCollection = Backbone.Tastypie.Collection.extend({
        initialize: function() {
            Backbone.Tastypie.Collection.prototype.initialize.apply(this, arguments);

            // Add created or added models to the 'added' list
            this.listenTo(this, "create add", function(model, collection, options) {
                if (!options || !options.nosync && !options.remote) {
                    this.mark(model, "added", true);
                }
            });

            // Add changed models to the 'changed' list
            this.listenTo(this, "change", function(model, options) {
                if ((!options || !options.remote && !options.nosync) && model && model.id && this.get(model.id) && this.localStorage.find(model) && !this.isMarked(model, "added")) {
                    this.mark(model, "changed", true);
                }
            });

            // Add destroyed models to 'destroyed' list
            this.listenTo(this, "destroy", function(model, collection, options) {
                if (!options || !options.nosync && !this.isMarked(model, "added")) {
                    this.mark(model, "destroyed", true);
                }
                this.mark(model, "added", false);
                this.mark(model, "changed", false);
            });

            // Remove synced models from the 'added' and 'changed' list and save them locally
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
            // Add, merge and keep models be default
            options = _.extend({add: true, merge: true, remove: true}, options);
            if (options.parse) {
                models = this.parse(models, options);
                options.parse = false;
            }
            // Filter out models that have been added, have been changed or destroyed. Those models should not yet be updated from the server
            // until the changes have been pushed
            models = models.filter(_.bind(function(model) {
                return !this.isMarked(model, "added") && !this.isMarked(model, "changed") && !this.isMarked(model, "destroyed");
            }, this));
            return Backbone.Tastypie.Collection.prototype.update.call(this, models, options);
        },
        /*
            Called when a new record was synced with the server
        */
        newRecordSynced: function(model, response, options) {
            // Remove 'old' model, i.e. the locally stored model with the preliminary id (lid)
            var oldModel = new this.model({id: options.lid});
            this.localStorage.destroy(oldModel);
            // Remove from 'added' list
            this.mark(oldModel, "added", false);
            if (model.get("syncStatus") == "posting") {
                // If the last syncStatus was 'posting', change syncStatus to 'synced'
                model.save({syncStatus: "synced"}, {nosync: true, silent: true});
                model.trigger("change:syncStatus", model);
            }
        },
        /*
            Called when a model was destroyed on the server
        */
        destroyedRecordSynced: function(model, response) {
            this.mark(model, "destroyed", false);
        },
        /*
            Called if model failed to upload
        */
        syncErrorHandler: function(model, request, options) {
            console.log("Model failed to sync. id: " + model.id + ", status code: " + request.status + ", response text: " + request.responseText);
            // Set sync status to 'postFailed'
            model.save({syncStatus: "postFailed"}, {nosync: true, silent: true});
            model.trigger("change:syncStatus", model);
        },
        /*
            Synchronizes all added, destroyed and modified models; Fetches new models from the server
        */
        syncRecords: function() {
            var added = this.getList("added");
            var changed = this.getList("changed");
            var destroyed = this.getList("destroyed");

            console.log("syncing records for collection " + this.localStorage.name + "...");
            console.log("added: " + JSON.stringify(added));
            console.log("changed: " + JSON.stringify(changed));
            console.log("destroyed: " + JSON.stringify(destroyed));

            // Load all remove models and update in local storage, IF the respective model has not been changed locally
            this.fetchAll({remote: true, update: true, add: true, remove: false, merge: true});

            // Sync all changed models
            for (var i=0; i<changed.length; i++) {
                var model = this.get(changed[i]);
                if (model && !this.isMarked(model, "added")) {
                    model.save(null, {remote: true, nosync: true, silent: true});
                }
            }

            // Sync all destroyed models
            for (i=0; i<destroyed.length; i++) {
                var model = new this.model({id: destroyed[i]});
                model.destroy({remote: true, wait: true, complete: _.bind(this.destroyedRecordSynced, this, model)});
            }

            // Sync all added models
            for (i=0; i<added.length; i++) {
                var model = this.get(added[i]);
                if (model && model.get("syncStatus") != "posting") {
                    // Set syncStatus to 'posting' to indicate that the model is being posted to the server
                    model.set({syncStatus: "posting"}, {nosync: true, silent: true});
                    model.trigger("change:syncStatus", model);
                    // Set 'lid' property so the synced handler can later know which object to remove from the local storage
                    var lid = model.id;
                    model.id = null;
                    // Remove local id; The object is going to get a new id from the server
                    model.unset("id");
                    // Call newRecordSynched after the chu has successfully been posted to remove it from the 'added' list
                    // and delete the object with the old, local id from the local storage
                    model.once("sync", this.newRecordSynced, this);
                    // Do the actual saving
                    model.save(null, {remote: true, lid: lid, error: this.syncErrorHandler});
                    model.id = lid;
                    model.set("id", lid);
                }
            }
        },
        /*
            Start syncing collection regularly. _interval_ is the time to wait between syncing. _options_
        */
        startPolling: function(interval, options) {
            this.pollInterval = setInterval(_.bind(function() {
                this.syncRecords();
            }, this), interval || 60000);
        }
    });

    /*
        Resembles a facebook friend as retrieved from graph.facebook.com/user_id/friends/
    */
    chuisy.models.FbFriend = Backbone.Model.extend({
        urlRoot: "https://graph.facebook.com/",
        getAvatar: function(width, height) {
            return _.result(this, "url") + "/picture/?width=" + (width || 50) + "&height=" + (height || 50);
        }
    });

    /*
        A collection of facebook friends as retrieved from graph.facebook.com/user_id/friends/
    */
    chuisy.models.FbFriendsCollection = Backbone.Collection.extend({
        model: chuisy.models.FbFriend,
        initialize: function(models, options) {
            Backbone.Collection.prototype.initialize.call(this, models, options);
            // This object is used for pagination
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
                // facebook explicitly provides the url for the next page so we'll simply use that
                url: this.paging && this.paging.next
            });
        },
        hasNextPage: function() {
            return this.paging && this.paging.next;
        },
        /*
            Fetch all facebook friends at once
        */
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


    /*
        A user object as exposed by the api under user/user_id/
    */
    chuisy.models.User = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/user/",
        authUrl: chuisy.apiRoot + chuisy.version + "/authenticate/",
        initialize: function(attributes, options) {
            Backbone.Tastypie.Model.prototype.initialize.call(this, attributes, options);
            // Add nested profile resource as own model
            this.profile = new chuisy.models.Profile(this.get("profile"));
            this.unset("profile");

            // When something in the profile changes, also trigger a change event on the user
            this.listenTo(this.profile, "change", function() {
                this.trigger("change change:profile", this);
            });
            // The users followers
            this.followers = new chuisy.models.UserCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "followers/";
                }, this)
            });
            // The users following this user
            this.following = new chuisy.models.UserCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "following/";
                }, this)
            });
            // The users friends, i.e. people followed by this user who follow this user back
            this.friends = new chuisy.models.UserCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "friends/";
                }, this)
            });
            // Chus by this user
            this.chus = new chuisy.models.ChuCollection([], {
                filters: _.bind(function() {
                    return {user: this.id};
                }, this)
            });
            //Liked Chus by this user
            this.likedChus = new chuisy.models.ChuCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "likes/";
                }, this)
            });
            //Liked Chus by this user
            this.goodies = new chuisy.models.CardCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "goodies/";
                }, this)
            });
            //Liked Chus by this user
            this.followedStores = new chuisy.models.StoreCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "stores/";
                }, this)
            });
            // This users facebook friends
            this.fbFriends = new chuisy.models.FbFriendsCollection([], {
                url: _.bind(function() {
                    return "https://graph.facebook.com/me/friends/?access_token=" + this.get("fb_access_token");
                }, this)
            });
        },
        parse: function(response) {
            // Parse nested profile resource into own model
            if (this.profile) {
                this.profile.set(response.profile, {nosync: true});
                delete response.profile;
            }
            return response;
        },
        toJSON: function() {
            // Serialize nested profile resource into user JSON to make sure it is stored locally along with the user
            var json = Backbone.Tastypie.Model.prototype.toJSON.apply(this, arguments);
            json.profile = this.profile.toJSON();
            delete json.profile.fb_og_share_actions;
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
        /*
            Exchange facebook token for auth credentials
        */
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
        /*
            Returns true, if the user has authentication credentials, false if not
        */
        isAuthenticated: function() {
            return this.get("username") && this.get("api_key") ? true : false;
        },
        /*
            Changes this users avatar. _url_ is the full path of a temporary image file. This file is moved to
            a permanent location and the new path stored locally. The avatar is then uploaded to the server.
        */
        changeAvatar: function(url) {
            fsShortcuts.moveFile(url, "avatars/", "avatar_" + new Date().getTime() + ".jpg", _.bind(function(newUrl) {
                this.save({localAvatar: newUrl}, {nosync: true});
                this.trigger("change:avatar", this);
                this.uploadAvatar();
                // Create a local thumbnail for the avatar
                this.makeThumbnail();
            }, this));
        },
        /*
            Uploads the locally store avatar to the server and stores the resulting remote url
        */
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
        /*
            Add a device for this user for push notifications
        */
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
                type: "POST"
            };
            Backbone.Tastypie.addAuthentication(options);
            Backbone.ajax(options);
        },
        /*
            If _following_ is true, the currently active user will follow this user. If false, the active user
            will unfollow this user.
        */
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
                type: "POST"
            };
            Backbone.Tastypie.addAuthentication(options);
            Backbone.ajax(options);
        },
        /*
            Let currently active user follow this user
        */
        follow: function() {
            this.setFollowing(true);
        },
        /*
            Let currently active user unfollow this user
        */
        unfollow: function() {
            this.setFollowing(false);
        },
        /*
            Toggle following this user
        */
        toggleFollow: function() {
            this.setFollowing(!this.get("following"));
        },
        getThumbnail: function(width, height) {
            if (this.profile.get("avatar")) {
                return _.result(this, "url") + "thumbnail/" + width + "x" + height + "/";
            } else {
                return null;
            }
        },
        getFullName: function() {
            var name = "";
            name += this.get("first_name") ? this.get("first_name") + " " : "";
            name += this.get("last_name") || "";
            return name;
        }
    });

    /*
        Resembles a model that is owned by a user, i.e. it has a 'user' attributes that points to a _User_ model
    */
    chuisy.models.OwnedModel = Backbone.Tastypie.Model.extend({
        save: function(attributes, options) {
            options = options || {};
            options.attrs = this.toJSON();
            _.extend(options.attrs, attributes);
            // Remove user from post/put params as the backend sets the user automatically based on the auth credentials
            delete options.attrs.user;
            Backbone.Tastypie.Model.prototype.save.call(this, attributes, options);
        }
    });

    /*
        A comment on a Chu
    */
    chuisy.models.ChuComment = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/chucomment/",
        /*
            Get a textual representation of the time passed since this comment was posted (e.g. '5 minutes ago')
        */
        getTimeText: function() {
            return util.timeToText(this.get("time"));
        }
    });

    /*
        A collection of chu comments
    */
    chuisy.models.ChuCommentCollection = Backbone.Tastypie.Collection.extend({
        model: chuisy.models.ChuComment,
        url: chuisy.apiRoot + chuisy.version + "/chucomment/",
        filters: function() {
            // If the collection has a _Chu_ object specified, only load comments on this chu
            return this.chu ? {chu: this.chu.id} : {};
        },
        initialize: function(models, options) {
            Backbone.Tastypie.Collection.prototype.initialize.call(this, models, options);
            // An optional Chu object. If provided, comments will be filtered by belonging to this chu 
            this.chu = options.chu;
        },
        add: function(models, options) {
            models = _.isArray(models) ? models : [models];
            if (this.chu) {
                // This collection has a Chu object specified, so all models in it should belong to this Chu
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

    /*
        A Chu
    */
    chuisy.models.Chu = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/chu/",
        initialize: function(attributes, options) {
            chuisy.models.OwnedModel.prototype.initialize.call(this, attributes, options);

            // Comments on this Chu
            this.comments = new chuisy.models.ChuCommentCollection([], {
                chu: this,
                comparator: function(model) {
                    return new Date(model.get("time"));
                }
            });

            // Likes for this Chu
            this.likes = new chuisy.models.UserCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "likes/";
                }, this)
            });

            this.listenTo(this, "sync", function(model, response, request) {
                if (request && request.xhr.status == 201 && this.get("localImage")) {
                    // Chu has just been created on the server. Time to upload the image!
                    this.trigger("image_changed", this);
                    this.uploadImage();
                }
            });
        },
        save: function(attributes, options) {
            attributes = attributes || {};
            var friends = attributes.friends || _.clone(this.get("friends"));
            if (!(this.collection && this.collection.localStorage) || options && options.remote) {
                // We want to post/put to the server, but Tastypie does not support passing nested many-to-many resources,
                // so we have to convert to a list of resource uris, which the api will accept
                attributes.friends = _.pluck(friends, "resource_uri");
            }
            chuisy.models.OwnedModel.prototype.save.call(this, attributes, options);
            this.set("friends", friends, {silent: true});
        },
        destroy: function() {
            if (this.get("localImage")) {
                // Delete the local image if any exists
                fsShortcuts.removeFile(this.get("localImage"));
            }
            if (this.get("localThumbnail")) {
                // Delete the local thumbnail if any exists
                fsShortcuts.removeFile(this.get("localThumbnail"));
            }
            return chuisy.models.OwnedModel.prototype.destroy.apply(this, arguments);
        },
        /*
            Get a textual representation of the time passed since this comment was posted (e.g. '5 minutes ago')
        */
        getTimeText: function() {
            return util.timeToText(this.get("time"));
        },
        /*
            Get image url for thumbnail with _width_ and _height_
        */
        getThumbnail: function(width, height) {
            if (this.get("image")) {
                return _.result(this, "url") + "thumbnail/" + width + "x" + height + "/";
            } else {
                return null;
            }
        },
        setLiked: function(liked) {
            var activeUser = chuisy.accounts.getActiveUser();

            if (!activeUser || !activeUser.isAuthenticated()) {
                console.error("There has to be an active authenticated user to perform this action!");
                return;
            }

            // Add or remove the user from the like collection
            if (liked) {
                this.likes.unshift(activeUser);
            } else {
                this.likes.remove(activeUser);
            }

            this.set("liked", liked);
            // Update likes count attribute
            this.set("likes_count", this.get("likes_count") + (liked ? 1 : -1));

            var options = {
                url: _.result(this, "url") + "like/",
                data: {like: liked},
                type: "POST"
            };
            // Add authentication so the server knows who want to like/unlike
            Backbone.Tastypie.addAuthentication(options);
            Backbone.ajax(options);
        },
        /*
            Like this Chu
        */
        like: function() {
            this.setLiked(true);
        },
        /*
            Unlike this Chu
        */
        unlike: function() {
            this.setLiked(false);
        },
        /*
            Toggle liking this Chu
        */
        toggleLike: function() {
            this.setLiked(!this.get("liked"));
        },
        /*
            Change the image of this Chu. _url_ is the path to a temporary image file that is first moved to a permanent
            location and then uploaded
        */
        changeImage: function(url, callback) {
            // Move the file to a permanent location
            fsShortcuts.moveFile(url, chuisy.closetDir, new Date().getTime() + ".jpg", _.bind(function(path) {
                // Save the path to the local image
                this.save({"localImage": path}, {nosync: true});
                this.trigger("image_changed", this);
                // Create a thumbnail for local storage
                this.makeThumbnail();
                callback(path);
            }, this), function() {
                callback(null);
            });
        },
        /*
            Download chu image to store it locally
        */
        downloadImage: function() {
            fsShortcuts.download(this.get("image"), chuisy.closetDir, this.id + ".jpg", _.bind(function(path) {
                this.save({"localImage": path}, {nosync: true});
                // Create thumbnail for local storage
                this.makeThumbnail();
            }, this));
        },
        /*
            Upload the local image to the server
        */
        uploadImage: function() {
            var uri = this.get("localImage");
            if (!uri) {
                console.warn("No local image to upload!");
                return;
            }
            // Set syncStatus to 'uploading' to indicate that the image is being uploaded
            this.set({syncStatus: "uploading"}, {nosync: true, silent: true});
            this.trigger("change:syncStatus", this);
            var target = encodeURI(_.result(this, "url") + "upload_image/" + Backbone.Tastypie.getAuthUrlParams());
            fsShortcuts.upload(uri, target, "image", uri.substr(uri.lastIndexOf('/')+1), "image/jpeg", _.bind(function(response) {
                this.save({"image": response}, {nosync: true});
                this.trigger("image_uploaded", this);
                // Set syncStatus to 'synced' to indicate that upload is complete
                this.save({syncStatus: "synced"}, {nosync: true, silent: true});
                this.trigger("change:syncStatus", this);
            }, this), _.bind(function(error) {
                console.log("Failed to upload image. id: " + this.id + ", error: " + error);
                // Set syncStatus to 'uploadFailed' to indicate that the upload failed
                this.save({syncStatus: "uploadFailed"}, {nosync: true, silent: true});
                this.trigger("change:syncStatus", this);
            }, this));
        },
        /*
            Create a 200x200 thumbnail of the Chu image and store it locally
        */
        makeThumbnail: function() {
            var image = this.get("localImage");
            if (!image) {
                console.error("Can't make thumbnail because there is no local image.");
                return;
            }
            util.createThumbnail(image, 100, 100, _.bind(function(imageData) {
                var fileName = "thumb_" + image.substring(image.lastIndexOf("/")+1);
                fsShortcuts.saveImageFromData(imageData, chuisy.closetDir + fileName, _.bind(function(path) {
                    this.save({localThumbnail: path}, {nosync: true});
                }, this));
            }, this));
        }
    });

    /*
        A like object
    */
    chuisy.models.Like = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/like/"
    });

    /*
        A FollowingRelation object
    */
    chuisy.models.FollowingRelation = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/followingrelation/"
    });

    /*
        A Notification object
    */
    chuisy.models.Notification = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/notification/",
        save: function(attributes, options) {
            attributes = attributes || {};
            var actor = _.clone(this.get("actor"));
            if (actor && actor.resource_uri && (!(this.collection && this.collection.localStorage) || options && options.remote)) {
                // We have to replace the nested actor resource because Tastypie has problems with it
                attributes.actor = actor.resource_uri;
            }
            chuisy.models.OwnedModel.prototype.save.call(this, attributes, options);
            this.set("actor", actor);
        },
        getTimeText: function() {
            return util.timeToText(this.get("time"));
        }
    });

    /*
        A device object, used for push notifications
    */
    chuisy.models.Device = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/device/"
    });

    /*
        A user profile
    */
    chuisy.models.Profile = chuisy.models.OwnedModel.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/profile/",
        toJSON: function() {
            var json = chuisy.models.OwnedModel.prototype.toJSON.apply(this, arguments);
            delete json.avatar_thumbnail;
            return json;
        }
    });

    /*
        A store
    */
    chuisy.models.Store = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/store/",
        initialize: function(attributes, options) {
            Backbone.Tastypie.Model.prototype.initialize.call(this, attributes, options);
            // Chus posted in this store
            this.chus = new chuisy.models.ChuCollection([], {
                filters: _.bind(function() {
                    return {store: this.id};
                }, this)
            });
            // The stores followers
            this.followers = new chuisy.models.UserCollection([], {
                url: _.bind(function() {
                    return _.result(this, "url") + "followers/";
                }, this)
            });
        },
        /*
            If _following_ is true, the currently active user will follow this user. If false, the active user
            will unfollow this user.
        */
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
                type: "POST"
            };
            Backbone.Tastypie.addAuthentication(options);
            Backbone.ajax(options);
        },
        /*
            Let currently active user follow this user
        */
        follow: function() {
            this.setFollowing(true);
        },
        /*
            Let currently active user unfollow this user
        */
        unfollow: function() {
            this.setFollowing(false);
        },
        /*
            Toggle following this user
        */
        toggleFollow: function() {
            this.setFollowing(!this.get("following"));
        }
    });

    /*
        A card
    */
    chuisy.models.Card = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/card/"
    });

    /*
        A coupon
    */
    chuisy.models.Coupon = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/coupon/",
        /*
            Redeem this coupon
        */
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
            // Need to add authentication so the backend knows who this came from
            Backbone.Tastypie.addAuthentication(options);
            Backbone.ajax(options);
        }
    });

    /*
        A collection that supports text search via the 'searchQuery' parameter in the options object
    */
    chuisy.models.SearchableCollection = Backbone.Tastypie.Collection.extend({
        fetch: function(options) {
            if (options && (options.searchQuery || options.center && options.radius)) {
                this.searchQuery = options.searchQuery;
                this.center = options.center;
                this.radius = options.radius;
            }

            if (this.searchQuery || this.center && this.radius) {
                var url = _.result(this, "url") + "search/";
                options = options || {};
                options.url = url;
                options.data = options.data || {};
                options.data.q = this.searchQuery;
                options.data.center = this.center;
                options.data.radius = this.radius;
            }

            Backbone.Tastypie.Collection.prototype.fetch.call(this, options);
        }
    });

    /*
        A collection of _User_ models
    */
    chuisy.models.UserCollection = chuisy.models.SearchableCollection.extend({
        model: chuisy.models.User,
        url: chuisy.apiRoot + chuisy.version + "/user/"
    });

    /*
        A collection of _Store_ models
    */
    chuisy.models.StoreCollection = chuisy.models.SearchableCollection.extend({
        model: chuisy.models.Store,
        url: chuisy.apiRoot + chuisy.version + "/store/"
    });

    /*
        A collection of signed in users
    */
    chuisy.models.Accounts = chuisy.models.SyncableCollection.extend({
        model: chuisy.models.User,
        url: chuisy.apiRoot + chuisy.version + "/user/",
        localStorage: new Backbone.LocalStorage("accounts"),
        initialize: function() {
            chuisy.models.SyncableCollection.prototype.initialize.apply(this, arguments);
            // Register if the avatar of a user has been changed so it can be synced later
            this.listenTo(this, "change:avatar", function(model, options) {
                this.mark(model, "avatar_changed", true);
            });
            this.listenTo(this, "sync:avatar", function(model, response, options) {
                this.mark(model, "avatar_changed", false);
            });
        },
        /*
            Set the currently active user
        */
        setActiveUser: function(model) {
            localStorage.setItem("accounts_active", model && model.id);
            this.trigger("change:active_user");
        },
        /*
            Get the currently active user
        */
        getActiveUser: function() {
            return this.get(localStorage.getItem("accounts_active"));
        },
        /*
            Synchronize changes on the active user
        */
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

    /*
        A collection of Chus
    */
    chuisy.models.ChuCollection = chuisy.models.SearchableCollection.extend({
        model: chuisy.models.Chu,
        url: chuisy.apiRoot + chuisy.version + "/chu/"
    });

    /*
        The Chu Feed. Contains a list of Chus relevant for the active User
    */
    chuisy.models.Feed = chuisy.models.ChuCollection.extend({
        url: chuisy.apiRoot + chuisy.version + "/chu/feed/",
        localStorage: new Backbone.LocalStorage("feed"),
        reset: function(models, options) {
            if (!options.remote) {
                return chuisy.models.ChuCollection.prototype.reset.call(this, models, options);
            }

            // Cache the first page of Chus
            this.each(function(model) {
                this.localStorage.destroy(model);
            }, this);
            chuisy.models.ChuCollection.prototype.reset.call(this, models, options);
            this.each(function(model) {
                this.localStorage.create(model);
            }, this);
        },
        fetch: function(options) {
            // Request thumbnails
            options = options || {};
            options.data = options.data || {};
            options.data.thumbnails = options.data.thumbnails || ["300x300"];
            return chuisy.models.ChuCollection.prototype.fetch.call(this, options);
        }
    });

    /*
        The Users Closet. Contains all Chus that the User hast posted. Is stored locally to allow offline posting
    */
    chuisy.models.Closet = chuisy.models.SyncableCollection.extend({
        model: chuisy.models.Chu,
        url: chuisy.apiRoot + chuisy.version + "/chu/",
        localStorage: new Backbone.LocalStorage("closet"),
        comparator: function(model) {
            // Order Chus by time descending
            return -(new Date(model.get("time")));
        },
        initialize: function() {
            chuisy.models.SyncableCollection.prototype.initialize.apply(this, arguments);
            // Register when the image has changed so it can be synced later
            this.listenTo(this, "image_changed", function(model, options) {
                if (!this.isMarked(model, "added")) {
                    this.mark(model, "image_changed", true);
                }
            });
            this.listenTo(this, "image_uploaded", function(model, response, options) {
                this.mark(model, "image_changed", false);
            });
            // Whenever a new Chu was fetched, download the image to store it locally
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
            // If there is an active user, filter by this user otherwise dont fetch any chus
            if (user && user.isAuthenticated()) {
                return {
                    user: user.id
                };
            } else {
                return {
                    // user=0 always returns no chus
                    user: 0
                };
            }
        },
        syncRecords: function() {
            // Synchronize changed images
            chuisy.models.SyncableCollection.prototype.syncRecords.apply(this, arguments);
            var image_changed = this.getList("image_changed");
            console.log("image_changed: " + JSON.stringify(image_changed));
            for (var i=0; i<image_changed.length; i++) {
                var model = this.get(image_changed[i]);
                if (model && !this.isMarked(model, "added")) {
                    model.uploadImage();
                }
            }
        },
        fetch: function(options) {
            // Request thumbnails
            options = options || {};
            options.data = options.data || {};
            options.data.thumbnails = options.data.thumbnails || ["100x100"];
            return chuisy.models.ChuCollection.prototype.fetch.call(this, options);
        },
        /*
            Check if the locally saved images/thumbnails still exist. Redownload/create them if not
        */
        checkLocalFiles: function() {
            this.each(function(model) {
                fsShortcuts.existsFile(model.get("localImage"), function(yes) {
                    if (!yes) {
                        console.log("Found missing or corrupt local image. Downloading...");
                        model.downloadImage();
                    } else {
                        fsShortcuts.existsFile(model.get("localThumbnail"), function(yes) {
                            if (!yes) {
                                console.log("Found missing or corrupt local thumbnail. Creating new one...");
                                model.makeThumbnail();
                            }
                        });
                    }
                });
            });
        }
    });

    /*
        Notifications for the active user
    */
    chuisy.models.Notifications = Backbone.Tastypie.Collection.extend({
        model: chuisy.models.Notification,
        url: chuisy.apiRoot + chuisy.version + "/notification/",
        /*
            Mark all notifications as seen
        */
        seen: function(options) {
            if (this.length) {
                options = options || {};
                options.url = _.result(this, "url") + "seen/";
                options.data = options.data || {};
                options.data.latest = this.at(0).get("time");
                this.each(function(el) {
                    el.set("seen", true);
                });
                Backbone.Tastypie.addAuthentication(options);
                Backbone.ajax(options);
            }
            this.meta = this.meta || {};
            this.meta.unseen_count = 0;
            this.trigger("seen");
        },
        /*
            Get number of unseen notifications
        */
        getUnseenCount: function() {
            return this.filter(function(el) {
                return !el.get("seen");
            }).length;
        },
        /*
            Get number of unread notifications
        */
        getUnreadCount: function() {
            return this.filter(function(el) {
                return !el.get("read");
            }).length;
        },
        fetch: function(options) {
            options = options || {};
            options.data = options.data || {};
            options.data.limit = options.data.limit || 40;
            Backbone.Tastypie.Collection.prototype.fetch.call(this, options);
        }
    });

    /*
        The collection of this users cards
    */
    chuisy.models.CardCollection = Backbone.Tastypie.Collection.extend({
        model: chuisy.models.Card,
        url: chuisy.apiRoot + chuisy.version + "/card/",
        // Card sizes, based on the format
        sizes: {
                "small": [1, 1],
                "wide": [2, 1],
                "tall": [1, 2],
                "big": [2, 2],
                "panorama": [3, 1]
        },
        /*
            Looks for the next item with a max width _width_ starting at index _from_
        */
        findNextItemWithMaxWidth: function(from, width) {
            for (var i=from; i<this.length; i++) {
                if (this.sizes[this.models[i].get("format")][0] <= width) {
                    return i;
                }
            }
        },
        /*
            Rearrange cards so that there is a minimum amount of gaps when displaying them in a repeater
            _colCount_ is the number of columns the cards need to fit into
        */
        compress: function(colCount) {
            colCount = colCount || 3;
            var i = 0;

            while (i < this.length) {
                var val = 0, j = i;
                // Try to fill up a row
                while (val < colCount && j < this.length) {
                    var model = this.models[j];
                    var format = model.get("format");
                    // Current 'width' of the row
                    val += this.sizes[format][0];
                    if (val > colCount) {
                        // If current row 'width' exceed the target width, then the last item added was too 'long'
                        // Find an item that is small enough and replace with the big one
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

    /*
        A foursquare venu
    */
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

    /*
        List of foursquare venues, cached locally
    */
    chuisy.models.Venues = Backbone.Collection.extend({
        model: chuisy.models.Venue,
        url: "https://api.foursquare.com/v2/venues/search",
        localStorage: new Backbone.LocalStorage("locations"),
        initialize: function() {
            Backbone.Collection.prototype.initialize.apply(this, arguments);
            // Save all fetched venues locally
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

    // $(document).ajaxError(function(e, xhr, options) {
    //     if (xhr.status == 401) {
    //         if (navigator.notification) {
    //             navigator.notification.alert(
    //                 $L("There was a problem with your authentication credentials. Please log in again."),
    //                 function() {
    //                     chuisy.signOut();
    //                     enyo.Signals.send("onRequestSignIn", {
    //                         context: "error"
    //                     });
    //                 },
    //                 $L("Authentication Problem"),
    //                 $L("Ok")
    //             );
    //         } else {
    //             alert($L("There was a problem with your authentication credentials. Please log in again."));
    //             chuisy.signOut();
    //             enyo.Signals.send("onRequestSignIn", {
    //                 context: "error"
    //             });
    //         }
    //     }
    //     if (xhr.status == 500) {
    //         if (navigator.notification) {
    //             navigator.notification.alert(
    //                 $L("Something went wrong. Don't worry, we're fixing it."),
    //                 $L("Server Problem"),
    //                 $L("Ok")
    //             );
    //         } else {
    //             alert($L("Something went wrong. Don't worry, we're fixing it."));
    //         }
    //     }
    // });

    /*
        A notice
    */
    chuisy.models.Notice = Backbone.Tastypie.Model.extend({
        urlRoot: chuisy.apiRoot + chuisy.version + "/notice/"
    });

    /*
        A collection of _Notice_ models
    */
    chuisy.models.NoticeCollection = Backbone.Tastypie.Collection.extend({
        model: chuisy.models.Notice,
        url: chuisy.apiRoot + chuisy.version + "/notice/"
    });


    chuisy.accounts = new chuisy.models.Accounts();
    chuisy.closet = new chuisy.models.Closet();
    chuisy.feed = new chuisy.models.Feed();
    chuisy.notifications = new chuisy.models.Notifications();
    chuisy.venues = new chuisy.models.Venues();
    chuisy.cards = new chuisy.models.CardCollection();
    chuisy.notices = new chuisy.models.NoticeCollection();

})(window.$, window._, window.Backbone, window.enyo);
