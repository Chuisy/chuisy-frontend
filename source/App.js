/**
    _App_ is the root UI component for the Chuisy app. The app can be run both in a browser window
    and on a mobile device using Phonegap/Cordova. For use with Phonegap, the _deviceReady_ handler
    is the entry point. Otherwise, the app is initialized after creation.
*/
enyo.kind({
    name: "App",
    fit: true,
    classes: "app",
    statics: {
        version: "1.3.0",
        twitterUrl: "http://twitter.com/share/",
        pinterestUrl: "http://pinterest.com/pin/create/button/",
        /**
            Checks if app is online. Only works properly with Phonegap.
            Otherwise always returns true.
        */
        isOnline: function() {
            if (navigator.connection) {
                var networkState = navigator.connection.type;
                return networkState != Connection.NONE;
            } else {
                return true;
            }
        },
        /**
            Checks if app is online by calling App.isOnline() and Notifies the user if not
        */
        checkConnection: function() {
            if (App.isOnline()) {
                return true;
            } else {
                navigator.notification.alert($L("Can't do this right now because there is no internet connection. Try again later!"), function() {}, $L("No internet connection"), $L("OK"));
                return false;
            }
        },
        /**
            Checks if app is running in a mobile browser
        */
        isMobile: function() {
            return navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/);
        },
        /**
            Retrieves a facebook access token from the appropriate sdk and calls _callback_ with the result
        */
        loginWithFacebook: function(callback, fail) {
            var scope = "user_birthday,user_location,user_about_me,user_website,email";
            FB.login({scope: scope}, function(response) {
                if (response.status == "connected") {
                    callback(response.authResponse.accessToken);
                    App.sendCubeEvent("fb_api", {
                        type: "connect",
                        scope: scope,
                        result: "success"
                    });
                } else {
                    App.sendCubeEvent("fb_api", {
                        type: "connect",
                        scope: scope,
                        result: "fail"
                    });
                    navigator.notification.alert($L("Chuisy could not connect with your facebook account. Please check your Facebook settings and try again!"),
                        fail, $L("Facebook signin failed!"), $L("OK"));
                }
            }, function(error) {
                App.sendCubeEvent("fb_api", {
                    type: "connect",
                    scope: scope,
                    result: error == "The user has cancelled the login" ? "cancel" : "fail"
                });
                // console.log("***** login fail ***** " + JSON.stringify(error));
                navigator.notification.alert($L("Chuisy could not connect with your facebook account. Please check your Facebook settings and try again!"),
                    fail, $L("Facebook signin failed!"), $L("OK"));
            });
        },
        fbHasPublishPermissions: function(callback) {
            if (!App.isMobile()) {
                callback(false);
                return;
            }
            if (App.fbHasPublishPermissionsCached !== undefined) {
                callback(App.fbHasPublishPermissionsCached);
                return;
            }
            FB.api('/me/permissions', function (response) {
                App.fbHasPublishPermissionsCached = response && response.data && response.data[0] && response.data[0].publish_actions;
                callback(App.fbHasPublishPermissionsCached);
            });
        },
        fbRequestPublishPermissions: function(success, failure) {
            if (!App.isMobile()) {
                return;
            }
            var scope = "publish_actions";
            App.fbHasPublishPermissions(function(yes) {
                if (!yes) {
                    FB.login({scope: scope}, function(response) {
                        if (response.authResponse) {
                            if (success) {
                                success(response.authResponse.accessToken);
                            }
                            App.sendCubeEvent("fb_api", {
                                type: "connect",
                                scope: scope,
                                result: "success"
                            });
                        } else {
                            if (failure) {
                                failure();
                            }
                            App.sendCubeEvent("fb_api", {
                                type: "connect",
                                scope: scope,
                                result: "fail"
                            });
                        }
                    }, function(error) {
                        if (failure) {
                            failure();
                        }
                        App.sendCubeEvent("fb_api", {
                            type: "connect",
                            scope: scope,
                            result: error == "The user has cancelled the login" ? "cancel" : "fail"
                        });
                    });
                } else if (success) {
                    success();
                }
            });
        },
        isSignedIn: function() {
            var user = chuisy.accounts.getActiveUser();
            return user && user.isAuthenticated();
        },
        getGeoLocation: function(success, failure) {
            navigator.geolocation.getCurrentPosition(function(position) {
                App.sendCubeEvent("action", {
                    type: "geolocation",
                    result: "success"
                });
                localStorage.setItem("chuisy.lastKnownLocation", JSON.stringify(position));
                App.lastKnownLocation = position;
                if (success) {
                    success(position);
                }
            }, function(error) {
                App.sendCubeEvent("action", {
                    type: "geolocation",
                    result: "fail",
                    error: error
                });
                // console.warn("Failed to retrieve geolocation! " + JSON.stringify(error));
                if (!App.lastKnownLocation) {
                    var lastPositionString = localStorage.getItem("chuisy.lastKnownLocation");
                    App.lastKnownLocation = lastPositionString ? JSON.parse(lastPositionString) : null;
                }
                if (App.lastKnownLocation && success) {
                    success(App.lastKnownLocation);
                } else if (!App.lastKnownLocation && failure) {
                    failure();
                }
            }, {
                maximumAge: 30000,
                enableHighAccuracy: true
            });
            localStorage.setItem("chuisy.hasAskedForGeolocation", true);
        },
        confirm: function(title, text, callback, buttonLabels) {
            if (navigator.notification) {
                if (!buttonLabels) {
                    buttonLabels = [$L("Cancel"), $L("Confirm")];
                }
                navigator.notification.confirm(text, function(choice) {
                    callback(choice == 2);
                }, title, buttonLabels);
            } else {
                var response = confirm(text);
                callback(response);
            }
        },
        requireSignIn: function(callback, context) {
            if (App.isSignedIn()) {
                callback();
            } else {
                enyo.Signals.send("onRequestSignIn", {
                    success: callback,
                    context: context
                });
            }
        },
        sendCubeEvent: function(type, data) {
            data = data || {};
            var user = chuisy.accounts.getActiveUser() && chuisy.accounts.getActiveUser().toJSON();
            if (user) {
                delete user.api_key;
                delete user.fb_access_token;
            }
            enyo.mixin(data, {
                location: App.lastKnownLocation,
                user: user,
                device: window.device,
                version: App.version,
                session_id: App.session && App.session.id,
                connection: navigator.connection && navigator.connection.type,
                screen_res: screen.width + "x" + screen.height
            });
            cube.send(type, data);
        },
        startSession: function() {
            App.session = {
                start: new Date(),
                id: util.generateUuid()
            };
            App.sendCubeEvent("app_lifecycle", {
                type: "start_session"
            });
        },
        endSession: function() {
            var duration = new Date().getTime() - App.session.start.getTime();
            App.sendCubeEvent("app_lifecycle", {
                type: "end_session",
                duration: duration
            });
        },
        optInSetting: function(setting, title, message, interval, callback) {
            var user = chuisy.accounts.getActiveUser();
            if (!user) {
                return;
            }

            var hasAsked = localStorage.getItem("chuisy.optInPrompts." + setting);
            var timePassed = hasAsked && interval && new Date().getTime() - parseInt(hasAsked, 10);
            // Ask once for the first time and, if user says no, ask again after a certain period of time
            if (!hasAsked || interval && timePassed > interval) {
                App.confirm(title, message, enyo.bind(this, function(choice) {
                    user.profile.set(setting, choice);
                    user.save();
                    chuisy.accounts.syncActiveUser();
                    App.sendCubeEvent("action", {
                        type: "opt_in",
                        subject: setting,
                        result: choice ? "accept" : "deny"
                    });
                    if (callback) {
                        callback(choice);
                    }
                }), [$L("No"), $L("Yes")]);
                localStorage.setItem("chuisy.optInPrompts." + setting, new Date().getTime());
            } else {
                callback(user.profile.get(setting));
            }
        },
        shareFacebook: function(message, url, image) {
            window.plugins.social.available("facebook", enyo.bind(this, function(available) {
                if (available) {
                    window.plugins.social.facebook(message, url, image, function() {
                        App.sendCubeEvent("fb_api", {
                            type: "share",
                            result: "success"
                        });
                    }, function() {
                        App.sendCubeEvent("fb_api", {
                            type: "share",
                            result: "fail"
                        });
                    });
                } else {
                    var params = {
                        method: "feed",
                        link: url,
                        picture: image
                    };
                    FB.ui(params, function(obj) {
                        App.sendCubeEvent("fb_api", {
                            type: "share",
                            result: obj && obj.post_id ? "success" : "fail"
                        });
                    });
                }
            }));
        },
        /**
            Open twitter share dialog
        */
        shareTwitter: function(message, url, image) {
            window.plugins.social.available("twitter", enyo.bind(this, function(available) {
                if (available) {
                    window.plugins.social.twitter(message, url, image, function() {
                        App.sendCubeEvent("action", {
                            type: "share_twitter",
                            result: "success"
                        });
                    }, function() {
                        App.sendCubeEvent("action", {
                            type: "share_twitter",
                            result: "fail"
                        });
                    });
                } else {
                    var target = App.twitterUrl + "?text=" + encodeURIComponent(message) + "&url=" + encodeURIComponent(url) + "&via=Chuisy";
                    window.open(target, "_blank");
                    App.sendCubeEvent("action", {
                        type: "share_twitter",
                        result: "open_web"
                    });
                }
            }));
        },
        /**
            Open pinterest share dialog
        */
        sharePinterest: function(url, image) {
            var target = this.pinterestUrl + "?url=" + encodeURIComponent(url) + "&media=" + encodeURIComponent(image);
            window.open(target, "_blank");
            App.sendCubeEvent("action", {type: "share_pinterest"});
        },
        /**
            Share image via instagram
        */
        shareInstagram: function(message, image) {
            util.watermark(image,function(dataUrl) {
                Instagram.share(dataUrl, message, function(err) {
                    App.sendCubeEvent("share_instagram", {
                        result: err ? "fail" : "success"
                    });
                });
            });
        },
        /**
            Open sms composer with message / link
        */
        shareMessaging: function(message, url) {
            window.plugins.smsComposer.showSMSComposer("", message + " " + url, function(result) {
                App.sendCubeEvent("share_messenger", {
                    result: result == 1 ? "success" : "fail"
                });
            });
            event.preventDefault();
            return true;
        },
        /**
            Open email composer with message / link
        */
        shareEmail: function(message, url) {
            var subject = $L("Look what I found on Chuisy!");
            window.plugins.emailComposer.showEmailComposerWithCallback(function(result) {
                App.sendCubeEvent("share_email", {
                    result: result == 2 ? "success" : "fail"
                });
            }, subject, message + " " + url);
        }
    },
    history: [["feed/"]],
    session: null,
    handlers: {
        ontap: "tapHandler", onfocus: "focusHandler", onBack: "back", onNavigateTo: "mainViewNavigateTo",
        onComposeChu: "composeChu", onShowChu: "showChu", onShowUser: "showUser", onShowSettings: "showSettings",
        onInviteFriends: "showInviteFriends", onShowStore: "showStore", onMenuChanged: "menuChanged",
        onNotificationSelected: "notificationSelected", onChuViewDone: "chuViewDone", onComposeChuDone: "composeChuDone",
        onGetStartedDone: "getStartedDone", onNoticeConfirmed: "noticeConfirmed", onShowDiscoverChus: "showDiscoverChus",
        onShowDiscoverUsers: "showDiscoverUsers", onShowDiscoverStores: "showDiscoverStores", onShowGuide: "showGuide",
        onGuideDone: "guideDone", onShowChuList: "showChuList", onShowUserList: "showUserList", onShowStoreList: "showStoreList",
        onShowCloset: "showCloset", onShowNearby: "showNearby"
    },
    create: function() {
        this.createStart = new Date();

        this.cachedUsers = new chuisy.models.UserCollection();
        this.cachedChus = new chuisy.models.ChuCollection();
        this.cachedStores = new chuisy.models.StoreCollection();

        this.inherited(arguments);

        // If app is running with Cordova, init will be called after the deviceready event
        if (!App.isMobile()) {
            this.init();
        }
        if (navigator.camera) {
            // Clean up temporary pictures
            navigator.camera.cleanup();
        }

        chuisy.accounts.on("change:active_user", this.activeUserChanged, this);
    },
    activeUserChanged: function() {
        this.cachedUsers.reset();
        this.cachedChus.reset();
        this.cachedStores.reset();
    },
    renderInto: function() {
        this.renderStart = new Date();
        this.inherited(arguments);
    },
    rendered: function() {
        this.inherited(arguments);

        // Hide splash screen if Cordova has been loaded yet
        if (this.isDeviceReady || !App.isMobile()) {
            this.raiseCurtain();
        }
        var now = new Date();
        App.sendCubeEvent("app_lifecycle", {
            type: "load",
            loading_time: now.getTime() - window.loadStart.getTime(),
            scripts_loading_time: this.createStart.getTime() - window.loadStart.getTime(),
            create_time: this.renderStart.getTime() - this.createStart.getTime(),
            render_time: now.getTime() - this.renderStart.getTime()
        });
    },
    deviceReady: function() {
        this.isDeviceReady = true;
        // Hide splash screen if the App has been rendered yet
        // Check if the app has been intitialized yet. Necessary since deviceready event
        // seems to be fired multiple times
        if (!this.initialized) {
            this.init();
            this.initialized = true;
        }

        if (this.hasNode()) {
            this.raiseCurtain();
        }
    },
    init: function() {
        if (App.isMobile()) {
            // init the FB JS SDK
            FB.init({
                appId      : '180626725291316', // App ID from the App Dashboard
                nativeInterface: CDV.FB,
                useCachedDialogs: false
            });
        }

        // window.onhashchange = enyo.bind(this, this.hashChanged);
        chuisy.init();

        enyo.Signals.send(App.isOnline() ? "ononline" : "onoffline");

        chuisy.notifications.on("seen reset", function() {
            if (App.isMobile()) {
                window.plugins.pushNotification.setApplicationIconBadgeNumber(chuisy.notifications.getUnseenCount(), function() {});
            }
        });

        if (App.isMobile()) {
            this.registerDevice();
            this.initPushNotifications();
        }

        // Update the version number in localstorage
        localStorage.setItem("chuisy.version", App.version);
    },
    raiseCurtain: function() {
        var guideSeen = localStorage.getItem("chuisy.guideSeen");
        if (!guideSeen) {
            this.showGuide();
            // setTimeout(enyo.bind(this, function() {
            //     this.$.signin.ready();
            // }), 500);
        } else if (!this.handledOpenUrl) {
            this.recoverStateFromUri();
            // setTimeout(enyo.bind(this, function() {
            //     this.$.signin.ready();
            // }), 500);
        }
        if (navigator.splashscreen) {
            navigator.splashscreen.hide();
        }
        App.startSession();
        this.checkPendingNotifications();

        if (!App.isSignedIn() && guideSeen) {
            this.showSignIn(this, {context: "start"});
        }
    },
    /**
        Checks any pending notifications and adds event listener for new push notifications
    */
    initPushNotifications: function() {
        var pushNotification = window.plugins.pushNotification;

        document.addEventListener('onPushNotification', enyo.bind(this, function(event) {
            chuisy.notifications.fetch({data: {limit: 5}});
            // this.log(JSON.stringify(event.notification));
            // pushNotification.setApplicationIconBadgeNumber(event.notification.aps.badge, function() {});
            enyo.Signals.send("onPushNotification", event);
            // navigator.notification.beep(1);
            // navigator.notification.vibrate(1000);
        }));
    },
    /**
        Registers device with apns and add it to the users account
    */
    registerDevice: function() {
        var user = chuisy.accounts.getActiveUser();
        if (user && user.isAuthenticated()) {
            try {
                window.plugins.pushNotification.registerDevice({alert:true, badge:true, sound:true}, enyo.bind(this, function(status) {
                    if (status.enabled && status.deviceToken) {
                        user.addDevice(status.deviceToken);
                    }
                }));
            } catch (e) {
                console.error("Could not register device! Error: " + e.message);
            }
        }
    },
    /**
        Checks if the app was launched by tapping on a notifications. If so, open the corresponding view
    */
    checkPendingNotifications: function() {
        if (window.plugins && window.plugins.pushNotification) {
            window.plugins.pushNotification.getPendingNotifications(enyo.bind(this, function(pending) {
                var notification = pending.notifications[0];
                if (notification) {
                    this.navigateToUri(notification.uri);
                    App.sendCubeEvent("action", {
                        type: "open_push_notification",
                        notification: notification
                    });
                }
            }));
        }
    },
    /**
        Loads and initializes js Facebook sdk
    */
    initFacebookWeb: function() {
        window.fbAsyncInit = enyo.bind(this, function() {
            console.log("facebook sdk loaded.");
            // init the FB JS SDK
            FB.init({
                appId      : '180626725291316', // App ID from the App Dashboard
                status     : true, // check the login status upon init?
                cookie     : true, // set sessions cookies to allow your server to access the session?
                xfbml      : true  // parse XFBML tags on this page?
            });
        });

        (function(d, debug){
            console.log("loading facebook sdk...");
            var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement('script'); js.id = id; js.async = true;
            js.src = "http://connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";
            ref.parentNode.insertBefore(js, ref);
        }(document, false));
    },
    online: function() {
        chuisy.setOnline(true);
        App.sendCubeEvent("app_lifecycle", {"type": "online"});
        return true;
    },
    offline: function() {
        chuisy.setOnline(false);
        App.sendCubeEvent("app_lifecycle", {"type": "offline"});
        return true;
    },
    resume: function() {
        App.startSession();
        this.checkPendingNotifications();
    },
    pause: function() {
        App.endSession();
    },
    // hashChanged: function() {
    //     if (!window.ignoreHashChange) {
    //         this.recoverStateFromUri();
    //     }
    //     window.ignoreHashChange = false;
    // },
    /**
        Gets hash fragment from url and open the appropriate content if possible
    */
    recoverStateFromUri: function() {
        var match, hash = window.location.hash;
        if ((match = hash.match(/^#!\/(.+)/))) {
            this.navigateToUri(match[1], null, true);
        } else {
            this.showFeed();
        }
    },
    /**
        Scans _uri_ for certain patterns and opens corresponding content if possible
    */
    navigateToUri: function(uri, params, direct) {
        params = params || {};
        if (uri.match(/^feed\/$/)) {
            // chufeed/
            // The chu feed it is! Let't open it.
            this.showFeed(this, params);
        } else if (uri.match(/^profile\/$/) || uri.match(/^me\/$/)) {
            // chubox/
            this.showProfile(this, params);
        } else if (uri.match(/^settings\/$/)) {
            // settings/
            // Open settings view
            this.showSettings(this, params);
        } else if (uri.match(/^closet\/$/)) {
            // chubox/
            // User wants to see his Chu Box? Our pleasure!
            this.showCloset(this, params);
        } else if (uri.match(/^goodies\/$/)) {
            // goodies/
            this.showGoodies(this, params);
        } else if ((match2 = uri.match(/^card\/(\d+)\/$/))) {
            // card/{card id}/
            this.showGoodies(this, params);
        } else if (uri.match(/^notifications\/$/)) {
            // notifications/
            // Whats new? Let's check out the notifications
            this.showNotifications(this, params);
        } else if (uri.match(/^invite\/$/)) {
            // invite/
            this.showInviteFriends(this, params);
        } else if (uri.match(/^discoverChus\/$/)) {
            // discoverChus/
            this.showDiscoverChus(this, params);
        } else if (uri.match(/^discoverUsers\/$/)) {
            // discoverUsers/
            this.showDiscoverUsers(this, params);
        } else if (uri.match(/^discoverStores\/$/)) {
            // discoverStores/
            this.showDiscoverStores(this, params);
        } else if (uri.match(/^nearby\/$/)) {
            // nearby/
            this.showNearby(this, params);
        } else if (uri.match(/^chus\/$/)) {
            // chus/
            this.showChuList(this, params);
        } else if (uri.match(/^users\/$/)) {
            // users/
            this.showUserList(this, params);
        } else if (uri.match(/^stores\/$/)) {
            // stores/
            this.showStoreList(this, params);
        } else if (uri.match(/^guide\/$/)) {
            // guide/
            this.showGuide(this, params);
        } else if ((match2 = uri.match(/^chu\/(.+)$/))) {
            // chu/..
            if (match2[1].match(/new\/$/)) {
                // chu/new/
                // Always glad to see new Chus. Let's open an empty chu view.
                this.showCompose(this, params);
            } else if ((match3 = match2[1].match(/^(\d+)\/$/))) {
                // chu/{chu id}
                params.obj = params.obj || new chuisy.models.Chu({id: match3[1], stub: true});
                this.showChu(this, params);
            }
        } else if ((match2 = uri.match(/^user\/(\d+)\/$/))) {
            // user/{user id}/
            // This is the URI to a users profile
            if (!params.obj && App.checkConnection()) {
                // A user object has been provided. So we can open it directly.
                params.obj = new chuisy.models.User({id: match2[1]});
                params.obj.fetch();
            }
            this.showUser(this, params);
        } else if ((match2 = uri.match(/^store\/(\d+)\/$/))) {
            // user/{user id}/
            // This is the URI to a users profile
            if (!params.obj && App.checkConnection()) {
                // A user object has been provided. So we can open it directly.
                params.obj = new chuisy.models.Store({id: match2[1]});
                params.obj.fetch();
            }
            this.showStore(this, params);
        } else if (uri.match(/((http|ftp|https):\/\/)[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:\/~\+#]*[\w\-\@?^=%&amp;\/~\+#])?/i)) {
            // Looks like its a hyperlink
            window.open(uri, "_blank");
        } else {
            this.log("Uri hash provided but no known pattern found!");
            // TODO: Show 404 Page
            this.showFeed(this, params);
        }
    },
    /**
        Adds current context to navigation history.
    */
    updateHistory: function(uri, params) {
        var last = this.history[this.history.length-1];
        var now = new Date();
        App.sendCubeEvent("navigate", {
            from: last && last[0],
            to: uri,
            duration: last && last[2] && (now.getTime() - last[2].getTime())
        });
        this.history.push([uri, params, now]);
        if (!App.isMobile()) {
            window.location.hash = "!/" + uri;
        }
    },
    /**
        Removes the latest context from the history and opens the previous one
    */
    back: function() {
        // if (this.history.length > 1) {
        //     var current = this.history[this.history.length-1];
        //     var last = this.history[this.history.length-2];
        //     this.history.pop();
        //     var params = last[1];
        //     params.inAnim = current[1].outAnim || AnimatedPanels.SLIDE_IN_FROM_LEFT;
        //     params.outAnim = current[1].inAnim || AnimatedPanels.SLIDE_OUT_TO_RIGHT;
        //     this.navigateToUri(last[0], params);
        //     // This view is already in the history so we gotta remove it or it will be there twice
        //     this.history.pop();
        // }
        if (this.history.length > 1) {
            this.history.pop();
            var last = this.history[this.history.length-1];
            var params = last[1] || {};
            params.inAnim = AnimatedPanels.SLIDE_IN_FROM_LEFT;
            params.outAnim = AnimatedPanels.SLIDE_OUT_TO_RIGHT;
            this.navigateToUri(last[0], params);
            // This view is already in the history so we gotta remove it or it will be there twice
            this.history.pop();
        }
    },
    signInSliderAnimateFinish: function(sender, event) {
        if (this.$.signInSlider.getValue() == this.$.signInSlider.getMax()) {
            // User has discarded the login dialog. Call the cancel function.
            this.$.signin.cancel();
        }
    },
    tapHandler: function(sender, event) {
        if (this.focusedInput && !(event.originator instanceof enyo.Input)) {
            this.focusedInput.hasNode().blur();
            this.focusedInput = null;
        }
    },
    focusHandler: function(sender, event) {
        this.focusedInput = event.originator;
    },
    prepareView: function(name) {
        if (!this.$[name]) {
            var c = this.$.panels.createComponent(this.lazyViews[name], {owner: this});
            if (c.deactivate) {
                c.deactivate();
            }
            c.render();
            return true;
        }
        return false;
    },
    showCompose: function(sender, event) {
        event = event || {};
        this.updateHistory("chu/new/", event);
        this.prepareView("compose");
        this.$.panels.select(this.$.compose, event.inAnim, event.outAnim);
    },
    showGuide: function(sender, event) {
        event = event || {};
        this.updateHistory("guide/", event);
        this.prepareView("guide");
        // this.$.panels.select(this.$.guide, event.inAnim, event.outAnim);
        this.$.panels.selectDirect(this.$.guide);
        this.$.guide.activate();
    },
    showChu: function(sender, event) {
        event = event || {};
        var obj = event.chu || event.obj;
        obj = obj instanceof chuisy.models.Chu ? obj : new chuisy.models.Chu(obj);
        obj = chuisy.closet.get(obj.id) || this.cachedChus.get(obj.id) || obj;
        this.cachedChus.add(obj);
        this.updateHistory("chu/" + obj.id + "/", event);
        this.prepareView("chu");
        this.$.chu.setChu(obj);
        this.$.panels.select(this.$.chu, event.inAnim, event.outAnim);
    },
    showUser: function(sender, event) {
        event = event || {};
        var obj = event.user || event.obj;
        obj = obj instanceof chuisy.models.User ? obj : new chuisy.models.User(obj);
        obj = this.cachedUsers.get(obj.id) || obj;
        this.cachedUsers.add(obj);
        this.updateHistory("user/" + obj.id + "/", event);
        this.prepareView("user");
        this.$.user.setUser(obj);
        this.$.panels.select(this.$.user, event.inAnim, event.outAnim);
    },
    showSettings: function(sender, event) {
        event = event || {};
        this.updateHistory("settings/", event);
        this.prepareView("settings");
        this.$.panels.select(this.$.settings, event.inAnim, event.outAnim);
    },
    showInviteFriends: function(sender, event) {
        event = event || {};
        this.updateHistory("invite/", event);
        this.prepareView("invite");
        this.$.panels.select(this.$.invite, event.inAnim, event.outAnim);
        this.$.invite.activate();
    },
    showStore: function(sender, event) {
        event = event || {};
        var obj = event.store || event.obj;
        obj = obj instanceof chuisy.models.Store ? obj : new chuisy.models.Store(obj);
        obj = this.cachedStores.get(obj.id) || obj;
        this.cachedStores.add(obj);
        this.updateHistory("store/" + obj.id + "/", event);
        this.prepareView("store");
        this.$.store.setStore(obj);
        this.$.panels.select(this.$.store, event.inAnim, event.outAnim);
    },
    showDiscoverChus: function(sender, event) {
        event = event || {};
        this.updateHistory("discoverChus/", event);
        this.prepareView("discoverChus");
        this.$.panels.select(this.$.discoverChus, event.inAnim, event.outAnim);
        this.$.discoverChus.loadTrending();
    },
    showDiscoverUsers: function(sender, event) {
        event = event || {};
        this.updateHistory("discoverUsers/", event);
        this.prepareView("discoverUsers");
        this.$.panels.select(this.$.discoverUsers, event.inAnim, event.outAnim);
        this.$.discoverUsers.loadTrending();
    },
    showDiscoverStores: function(sender, event) {
        event = event || {};
        this.updateHistory("discoverStores/", event);
        this.prepareView("discoverStores");
        this.$.panels.select(this.$.discoverStores, event.inAnim, event.outAnim);
        this.$.discoverStores.loadTrending();
    },
    showChuList: function(sender, event) {
        event = event || {};
        this.updateHistory("chus/", event);
        this.prepareView("chuList");
        this.$.panels.select(this.$.chuList, event.inAnim, event.outAnim);
        this.$.chuList.setTitle(event.title);
        this.$.chuList.setChus(event.chus);
    },
    showUserList: function(sender, event) {
        event = event || {};
        this.updateHistory("users/", event);
        this.prepareView("userList");
        this.$.panels.select(this.$.userList, event.inAnim, event.outAnim);
        this.$.userList.setUsers(event.users);
        this.$.userList.setTitle(event.title);
    },
    showStoreList: function(sender, event) {
        event = event || {};
        this.updateHistory("stores/", event);
        this.prepareView("storeList");
        this.$.panels.select(this.$.storeList, event.inAnim, event.outAnim);
        this.$.storeList.setStores(event.stores);
        this.$.storeList.setTitle(event.title);
    },
    showFeed: function(sender, event) {
        event = event || {};
        this.updateHistory("feed/", event);
        this.$.panels.select(this.$.mainView, event.inAnim, event.outAnim);
        this.$.mainView.showFeed(event.chu);
    },
    showProfile: function(sender, event) {
        event = event || {};
        this.updateHistory("profile/", event);
        this.$.mainView.showProfile();
        this.$.panels.select(this.$.mainView, event.inAnim, event.outAnim);
    },
    showGoodies: function(sender, event) {
        event = event || {};
        this.updateHistory("goodies/", event);
        this.$.mainView.showGoodies();
        this.$.panels.select(this.$.mainView, event.inAnim, event.outAnim);
    },
    showNotifications: function(sender, event) {
        event = event || {};
        this.updateHistory("notifications/", event);
        this.$.mainView.showNotifications();
        this.$.panels.select(this.$.mainView, event.inAnim, event.outAnim);
    },
    showCloset: function(sender, event) {
        event = event || {};
        this.updateHistory("closet/", event);
        this.prepareView("closet");
        this.$.closet.finishEditing();
        this.$.panels.select(this.$.closet, event.inAnim, event.outAnim);
    },
    showNearby: function(sender, event) {
        event = event || {};
        this.updateHistory("nearby/", event);
        this.prepareView("nearby");
        this.$.panels.select(this.$.nearby, event.inAnim, event.outAnim);
        this.$.nearby.loadStores();
    },
    showSignIn: function(sender, event) {
        event = event || {};
        if (!this.$.signin) {
            this.createComponent(this.lazyViews.signin).render();
        }
        this.$.signin.setSuccessCallback(event ? event.success : null);
        this.$.signin.setFailureCallback(event ? event.failure : null);
        this.$.signin.setContext(event.context);
        this.$.signin.open();
    },
    notificationSelected: function(sender, event) {
        this.navigateToUri(event.notification.get("uri"), {obj: event.notification.get("target_obj")});
    },
    chuViewDone: function(sender, event) {
        this.showFeed(sender, {chu: event.chu});
    },
    composeChuDone: function(sender, event) {
        this.showFeed(sender, {chu: event.chu});
    },
    getStartedDone: function() {
        this.showFeed();
    },
    noticeConfirmed: function(sender, event) {
        this.navigateToUri(event.notice.get("uri"));
    },
    handleOpenUrl: function(sender, event) {
        // The app was opened on iOS via a custom url sheme. See if there is a uri to a chuisy object
        // embedded and if true navigate to that uri
        var match = event.url.match(/chuisy.com\/((\w+\/?)*)(\?|$)/);
        if (match) {
            this.navigateToUri(match[1]);
            this.handledOpenUrl = true;
        }
    },
    guideDone: function(sender, event) {
        this.showFeed();
        localStorage.setItem("chuisy.guideSeen", true);
    },
    menuChanged: function(sender, event) {
        var viewName = event.value.charAt(0).toUpperCase() + event.value.slice(1);
        this["show" + viewName]();
    },
    panelsAnimationStart: function(sender, event) {
        if (event.newPanel.activate) {
            event.newPanel.activate();
        }
    },
    panelsAnimationEnd: function(sender, event) {
        if (event.oldPanel.deactivate) {
            event.oldPanel.deactivate();
        }
    },
    /**
        Opens the device's camera
    */
    composeChu: function() {
        this.showCompose();
        this.$.compose.clear();
        var getImageTime = new Date();
        try {
            navigator.camera.getPicture(enyo.bind(this, function(uri) {
                this.$.compose.setImage(uri);
                App.sendCubeEvent("action", {
                    type: "get_image",
                    result: "success",
                    duration: new Date().getTime() - getImageTime.getTime()
                });
            }), enyo.bind(this, function(message) {
                var result = message == "no image selected" ? "cancel" : "fail";
                App.sendCubeEvent("action", {
                    type: "get_image",
                    result: result,
                    error: result == "fail" ? message : undefined,
                    duration: new Date().getTime() - getImageTime.getTime()
                });
                this.back();
            }), {targetWidth: 612, targetHeight: 612, allowEdit: true, correctOrientation: true, quality: 49});
        } catch (e) {
            this.warn("No camera available!");
            this.$.compose.setImage("");
        }
    },
    signInDone: function(sender, event) {
        this.$.signin.close();
        if (event.success) {
            // Probably won't need this view again so we can destroy it
            setTimeout(enyo.bind(this, function() {
                this.$.signin.destroy();
            }), 1000);
        }
    },
    lazyViews: {
        // CREATE NEW CHU
        "compose": {kind: "ComposeChu", name: "compose", onDone: "composeChuDone"},
        // // DISPLAY CHU
        "chu": {kind: "ChuView", name: "chu", onDone: "chuViewDone"},
        // // SETTINGS
        "settings": {kind: "Settings", name: "settings"},
        // // USER VIEW
        "user": {kind: "UserView", name: "user"},
        // // LOCATION VIEW
        "store": {kind: "StoreView", name: "store"},
        "closet": {kind: "Closet", name: "closet"},
        // // DISCOVER CHUS
        "discoverChus": {kind: "DiscoverChus", name: "discoverChus"},
        "discoverUsers": {kind: "DiscoverUsers", name: "discoverUsers"},
        "discoverStores": {kind: "DiscoverStores", name: "discoverStores"},
        "invite": {kind: "InviteFriends", name: "invite"},
        "guide": {kind: "Guide", name: "guide", onDone: "guideDone"},
        "chuList": {kind: "ChuListView", name: "chuList"},
        "userList": {kind: "UserListView", name: "userList"},
        "storeList": {kind: "StoreListView", name: "storeList"},
        "nearby": {kind: "Nearby", name: "nearby"},
        // FACEBOOK SIGNIN
        "signin": {kind: "SignInView", name: "signin", onDone: "signInDone"}
    },
    components: [
        {classes: "header", style: "width: 100%; position: absolute; top: 0; left: 0; z-index: -100; box-shadow: none;"},
        {kind: "AnimatedPanels", async: true, classes: "enyo-fill", name: "panels", onInAnimationStart: "panelsAnimationStart", onOutAnimationEnd: "panelsAnimationEnd", components: [
            {kind: "MainView", name: "mainView"}
        ]},
        {kind: "Signals", ondeviceready: "deviceReady", ononline: "online", onoffline: "offline", onresume: "resume", onpause: "pause",
            onRequestSignIn: "showSignIn", onHandleOpenUrl: "handleOpenUrl"}
    ]
});
