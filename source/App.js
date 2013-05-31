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
        /**
            Checks if app is online. Only works properly with Phonegap.
            Otherwise always returns true.
        */
        isOnline: function() {
            if (navigator.connection) {
                var networkState = navigator.connection.type;
                return networkState != Connection.UNKNOWN && networkState != Connection.NONE;
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
        loginWithFacebook: function(callback) {
            var scope = "user_birthday,user_location,user_about_me,user_website,email";
            App.sendCubeEvent("fb_connect_open", {
                scope: scope
            });
            FB.login({scope: scope}, function(response) {
                if (response.status == "connected") {
                    callback(response.authResponse.accessToken);
                    App.sendCubeEvent("fb_connect_success", {
                        scope: scope
                    });
                } else {
                    navigator.notification.alert($L("Chuisy could not connect with your facebook account. Please check your Facebook settings and try again!"),
                        function() {}, $L("Facebook signin failed!"), $L("OK"));
                }
            }, function(error) {
                // console.log("***** login fail ***** " + JSON.stringify(error));
                navigator.notification.alert($L("Chuisy could not connect with your facebook account. Please check your Facebook settings and try again!"),
                    function() {}, $L("Facebook signin failed!"), $L("OK"));
            });
        },
        fbRequestPublishPermissions: function(success, failure) {
            if (!App.isMobile()) {
                return;
            }
            var scope = "publish_actions";
            FB.api('/me/permissions', function (response) {
                if (response && response.data && response.data[0] && !response.data[0].publish_actions) {
                    App.sendCubeEvent("fb_connect_open", {
                        scope: scope
                    });
                    FB.login({scope: scope}, function(response) {
                        if (response.authResponse) {
                            if (success) {
                                success(response.authResponse.accessToken);
                            }
                            App.sendCubeEvent("fb_connect_success", {
                                scope: scope
                            });
                        } else {
                            console.log($L("Facebook signin failed!"));
                            if (failure) {
                                failure();
                            }
                        }
                    }, function(error) {
                        // console.log("***** login fail ***** " + JSON.stringify(error));
                    });
                }
            });
        },
        isSignedIn: function() {
            var user = chuisy.accounts.getActiveUser();
            return user && user.isAuthenticated();
        },
        getGeoLocation: function(success, failure) {
            navigator.geolocation.getCurrentPosition(function(position) {
                App.sendCubeEvent("geolocation_success");
                localStorage.setItem("chuisy.lastKnownLocation", JSON.stringify(position));
                App.lastKnownLocation = position;
                if (success) {
                    success(position);
                }
            }, function(error) {
                App.sendCubeEvent("geolocation_fail", {
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
            });
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
            App.sendCubeEvent("start_session");
        },
        endSession: function() {
            var duration = new Date().getTime() - App.session.start.getTime();
            App.sendCubeEvent("end_session", {duration: duration});
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
                    App.sendCubeEvent("ask_opt_in", {
                        choice: choice
                    });
                    if (callback) {
                        callback(choice);
                    }
                }), [$L("No"), $L("Yes")]);
                localStorage.setItem("chuisy.optInPrompts." + setting, new Date().getTime());
            } else {
                callback(user.profile.get(setting));
            }
        }
    },
    history: [],
    session: null,
    handlers: {
        ontap: "tapHandler",
        onfocus: "focusHandler"
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
    },
    renderInto: function() {
        this.renderStart = new Date();
        this.inherited(arguments);
    },
    rendered: function() {
        this.inherited(arguments);

        // Hide splash screen if Cordova has been loaded yet
        if (this.isDeviceReady || !App.isMobile()) {
            setTimeout(enyo.bind(this, function() {
                this.raiseCurtain();
            }), 1000);
        }
        var now = new Date();
        App.sendCubeEvent("load_app", {
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
            setTimeout(enyo.bind(this, function() {
                this.raiseCurtain();
            }), 1000);
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

        chuisy.notifications.on("reset", function() {
            if (App.isMobile()) {
                window.plugins.pushNotification.setApplicationIconBadgeNumber(chuisy.notifications.meta.unseen_count, function() {});
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
        if (!App.isSignedIn()) {
            this.$.signInView.setSuccessCallback(enyo.bind(this, function() {
                this.navigateTo("getstarted", null, true);
            }));
            this.$.signInView.setFailureCallback(enyo.bind(this, function() {
                this.navigateTo("feed", null, true);
            }));
            this.$.signInView.setContext("start");
            this.$.signInView.ready();
            // this.$.signInSlider.setValue(0);
        } else {
            this.signInViewDone();
            setTimeout(enyo.bind(this, function() {
                this.$.signInView.ready();
            }), 500);
            this.recoverStateFromUri();
        }
        if (navigator.splashscreen) {
            navigator.splashscreen.hide();
        }
        App.startSession();
    },
    /**
        Checks any pending notifications and adds event listener for new push notifications
    */
    initPushNotifications: function() {
        var pushNotification = window.plugins.pushNotification;

        this.checkPendingNotifications();
        document.addEventListener('onPushNotification', enyo.bind(this, function(event) {
            chuisy.notifications.fetch();
            // this.log(JSON.stringify(event.notification));
            // pushNotification.setApplicationIconBadgeNumber(event.notification.aps.badge, function() {});
            enyo.Signals.send("onPushNotification", event);
            navigator.notification.beep(1);
            navigator.notification.vibrate(1000);
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
        window.plugins.pushNotification.getPendingNotifications(enyo.bind(this, function(pending) {
            var notification = pending.notifications[0];
            if (notification) {
                this.navigateToUri(notification.uri);
                App.sendCubeEvent("open_push_notification", {
                    notification: notification
                });
            }
        }));
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
        this.log("online");
        chuisy.setOnline(true);
        App.sendCubeEvent("online");
        return true;
    },
    offline: function() {
        this.log("offline");
        chuisy.setOnline(false);
        App.sendCubeEvent("offline");
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
            this.updateHistory("feed");
            this.navigateToUri(match[1], null, true);
        } else {
            this.navigateTo("feed", null, true);
        }
    },
    /**
        Scans _uri_ for certain patterns and opens corresponding content if possible
    */
    navigateToUri: function(uri, obj, direct) {
        if (uri.match(/^feed\/$/)) {
            // chufeed/
            // The chu feed it is! Let't open it.
            this.navigateTo("feed", obj, direct);
        } else if (uri.match(/^discover\/$/)) {
            // discover/
            // Lets discover some stuff!
            this.navigateTo("discover", obj, direct);
        } else if (uri.match(/^profile\/$/) || uri.match(/^me\/$/)) {
            // chubox/
            // User wants to see his Chu Box? Our pleasure!
            this.navigateTo("profile", obj, direct);
        } else if (uri.match(/^settings\/$/) || uri.match(/^me\/$/)) {
            // settings/
            // Open settings view
            this.navigateTo("settings", obj, direct);
        } else if (uri.match(/^closet\/$/)) {
            // chubox/
            // User wants to see his Chu Box? Our pleasure!
            this.navigateTo("closet", obj, direct);
        } else if (uri.match(/^goodies\/$/)) {
            // goodies/
            this.navigateTo("goodies", obj, direct);
        } else if ((match2 = uri.match(/^card\/(\d+)\/$/))) {
            // card/{card id}/
            this.navigateTo("goodies", obj, direct);
        } else if (uri.match(/^notifications\/$/)) {
            // chubox/
            // Whats new? Let's check out the notifications
            this.navigateTo("notifications", obj, direct);
        } else if (uri.match(/^invite\/$/)) {
            // invite/
            this.navigateTo("invite", obj, direct);
        } else if (uri.match(/^discoverChus\/$/)) {
            // invite/
            this.navigateTo("discoverChus", obj, direct);
        } else if (uri.match(/^discoverUsers\/$/)) {
            // invite/
            this.navigateTo("discoverUsers", obj, direct);
        } else if (uri.match(/^discoverStores\/$/)) {
            // invite/
            this.navigateTo("discoverStores", obj, direct);
        } else if ((match2 = uri.match(/^chu\/(.+)$/))) {
            // chu/..
            if (match2[1].match(/new\/$/)) {
                // chu/new/
                // Always glad to see new Chus. Let's open an empty chu view.
                this.navigateTo("compose", obj, direct);
            } else if ((match3 = match2[1].match(/^(\d+)\/$/))) {
                // chu/{chu id}
                obj = obj || new chuisy.models.Chu({id: match3[1], stub: true});
                this.navigateTo("chu", obj, direct);
            }
        } else if ((match2 = uri.match(/^user\/(\d+)\/$/))) {
            // user/{user id}/
            // This is the URI to a users profile
            if (!obj && App.checkConnection()) {
                // A user object has been provided. So we can open it directly.
                obj = new chuisy.models.User({id: match2[1]});
                obj.fetch();
            }
            this.navigateTo("user", obj, direct);
        } else if ((match2 = uri.match(/^store\/(\d+)\/$/))) {
            // user/{user id}/
            // This is the URI to a users profile
            if (!obj && App.checkConnection()) {
                // A user object has been provided. So we can open it directly.
                obj = new chuisy.models.Store({id: match2[1]});
                obj.fetch();
            }
            this.navigateTo("store", obj, direct);
        } else if (uri.match(/((http|ftp|https):\/\/)[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:\/~\+#]*[\w\-\@?^=%&amp;\/~\+#])?/i)) {
            // Looks like its a hyperlink
            window.open(uri, "_blank");
        } else {
            this.log("Uri hash provided but no known pattern found!");
            // TODO: Show 404 Page
            this.navigateTo("feed", obj, direct);
        }
    },
    navigateTo: function(view, obj, direct) {
        switch (view) {
            case "chu":
                obj = obj instanceof chuisy.models.Chu ? obj : new chuisy.models.Chu(obj);
                obj = chuisy.closet.get(obj.id) || this.cachedChus.get(obj.id) || obj;
                this.cachedChus.add(obj);
                this.updateHistory("chu/" + obj.id + "/", obj);
                break;
            case "gift":
                this.updateHistory("gift/" + obj.id + "/", obj);
                break;
            case "user":
                obj = obj instanceof chuisy.models.User ? obj : new chuisy.models.User(obj);
                obj = this.cachedUsers.get(obj.id) || obj;
                this.cachedUsers.add(obj);
                this.updateHistory("user/" + obj.id + "/", obj);
                break;
            case "profile":
                this.updateHistory("profile/");
                var user = chuisy.accounts.getActiveUser();
                if (user) {
                    enyo.Signals.send("onShowGuide", {view: "profile"});
                    user.fetch({remote: true});
                }
                break;
            case "store":
                obj = obj instanceof chuisy.models.Store ? obj : new chuisy.models.Store(obj);
                obj = this.cachedStores.get(obj.id) || obj;
                this.cachedStores.add(obj);
                this.updateHistory("store/" + obj.id + "/", obj);
                break;
            case "goodies":
                if (obj && !(obj instanceof chuisy.models.Card)) {
                    obj = new chuisy.models.Card(obj);
                }
                this.updateHistory("goodies");
                break;
            default:
                this.updateHistory(view + "/");
                break;
        }
        this.$.mainView.openView(view, obj, direct);
    },
    /**
        Adds current context to navigation history.
    */
    updateHistory: function(uri, obj) {
        var last = this.history[this.history.length-1];
        var now = new Date();
        App.sendCubeEvent("navigate", {
            from: last && last[0],
            from_obj: last && last[1],
            to: uri,
            to_obj: obj,
            duration: last && (now.getTime() - last[2].getTime())
        });
        this.history.push([uri, obj, now]);
        if (!App.isMobile()) {
            window.location.hash = "!/" + uri;
        }
    },
    /**
        Removes the latest context from the history and opens the previous one
    */
    back: function() {
        if (this.history.length > 1) {
            this.history.pop();
            var last = this.history[this.history.length-1];
            this.navigateToUri(last[0], last[1]);
            // This view is already in the history so we gotta remove it or it will be there twice
            this.history.pop();
        }
    },
    /**
        Sets the success and error callback specified in _event.success_ and _event.failure_ and opens the Facebook sign in dialog
    */
    requestSignIn: function(sender, event) {
        this.$.signInView.setSuccessCallback(event ? event.success : null);
        this.$.signInView.setFailureCallback(event ? event.failure : null);
        this.$.signInView.setContext(event.context);
        // this.$.signInSlider.animateToMin();
        this.$.signInView.addClass("showing");
    },
    signInViewDone: function() {
        // this.$.signInSlider.animateToMax();
        this.$.signInView.removeClass("showing");
    },
    signInSliderAnimateFinish: function(sender, event) {
        if (this.$.signInSlider.getValue() == this.$.signInSlider.getMax()) {
            // User has discarded the login dialog. Call the cancel function.
            this.$.signInView.cancel();
        }
    },
    showGuide: function(sender, event) {
        var viewsShown = JSON.parse(localStorage.getItem("chuisy.viewsShown") || "{}");

        if (!viewsShown[event.view]) {
            this.$.guide.setView(event.view);
            this.$.guide.open();
            viewsShown[event.view] = true;
            localStorage.setItem("chuisy.viewsShown", JSON.stringify(viewsShown));
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
    composeChu: function(sender, event) {
        this.navigateTo("compose");
    },
    showChu: function(sender, event) {
        this.navigateTo("chu", event.chu);
    },
    showUser: function(sender, event) {
        this.navigateTo("user", event.user);
    },
    showSettings: function() {
        this.navigateTo("settings");
    },
    showInviteFriends: function() {
        this.navigateTo("invite");
    },
    showStore: function(sender, event) {
        this.navigateTo("store", event.store);
    },
    showDiscoverChus: function(sender, event) {
        this.navigateTo("discoverChus");
    },
    showDiscoverUsers: function(sender, event) {
        this.navigateTo("discoverUsers");
    },
    showDiscoverStores: function(sender, event) {
        this.navigateTo("discoverStores");
    },
    menuChanged: function(sender, event) {
        this.navigateTo(event.value);
    },
    notificationSelected: function(sender, event) {
        this.navigateToUri(event.notification.get("uri"), event.notification.get("target_obj"));
    },
    chuViewDone: function(sender, event) {
        this.navigateTo("feed", event.chu);
    },
    composeChuDone: function(sender, event) {
        this.navigateTo("chu", event.chu);
    },
    getStartedDone: function() {
        this.navigateTo("feed");
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
        }
    },
    components: [
        {kind: "SignInView", onDone: "signInViewDone", classes: "app-signinview showing"},
        {kind: "MainView", classes: "enyo-fill", onBack: "back", onNavigateTo: "mainViewNavigateTo",
            onComposeChu: "composeChu", onShowChu: "showChu", onShowUser: "showUser", onShowSettings: "showSettings",
            onInviteFriends: "showInviteFriends", onShowStore: "showStore", onMenuChanged: "menuChanged",
            onNotificationSelected: "notificationSelected", onChuViewDone: "chuViewDone", onComposeChuDone: "composeChuDone",
            onGetStartedDone: "getStartedDone", onNoticeConfirmed: "noticeConfirmed", onShowDiscoverChus: "showDiscoverChus",
            onShowDiscoverUsers: "showDiscoverUsers", onShowDiscoverStores: "showDiscoverStores"},
        // FACEBOOK SIGNIN
        {kind: "Guide"},
        {kind: "Signals", ondeviceready: "deviceReady", ononline: "online", onoffline: "offline", onresume: "resume", onpause: "pause",
            onRequestSignIn: "requestSignIn", onShowGuide: "showGuide", onHandleOpenUrl: "handleOpenUrl"}
    ]
});
