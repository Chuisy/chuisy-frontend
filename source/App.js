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
        version: "1.0.1",
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
                navigator.notification.alert($L("Can't do this right now because there is no Internet connection. Try again later!"), function() {}, $L("No internet connection"), $L("OK"));
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
            FB.login(function(response) {
                if (response.status == "connected") {
                    callback(response.authResponse.accessToken);
                } else {
                    console.log($L("Facebook signin failed!"));
                }
            }, {scope: "user_birthday,user_location,user_about_me,user_website,email"});
        },
        fbRequestPublishPermissions: function(success, failure) {
            FB.api('/me/permissions', function (response) {
                if (response && response.data && response.data[0] && !response.data[0].publish_actions) {
                    FB.login(function(response) {
                        if (response.authResponse) {
                            if (success) {
                                success(response.authResponse.accessToken);
                            }
                        } else {
                            console.log($L("Facebook signin failed!"));
                            if (failure) {
                                failure();
                            }
                        }
                    }, {scope: "publish_actions"});
                }
            });
        },
        isSignedIn: function() {
            var user = chuisy.accounts.getActiveUser();
            return user && user.isAuthenticated();
        },
        getGeoLocation: function(success, failure) {
            navigator.geolocation.getCurrentPosition(function(position) {
                localStorage.setItem("chuisy.lastKnownLocation", JSON.stringify(position));
                if (success) {
                    success(position);
                }
            }, function(error) {
                console.error("Failed to retrieve geolocation! " + JSON.stringify(error));
                var lastPositionString = localStorage.getItem("chuisy.lastKnownLocation");
                lastPosition = lastPositionString ? JSON.parse(lastPositionString) : null;
                if (lastPosition && success) {
                    success(lastPosition);
                } else if (failure) {
                    failure();
                }
            });
        }
    },
    history: [],
    handlers: {
        ontap: "tapHandler",
        onfocus: "focusHandler"
    },
    create: function() {
        this.inherited(arguments);

        // If app is running with Cordova, init will be called after the deviceready event
        if (!App.isMobile()) {
            this.init();
        }
    },
    /**
        Hides the apps splash screen with a slight delay
    */
    hideSplashScreen: function() {
        setTimeout(function() {
            navigator.splashscreen.hide();
        }, 1000);
    },
    rendered: function() {
        this.inherited(arguments);

        // Hide splash screen if Cordova has been loaded yet
        if (navigator.splashscreen) {
            this.hideSplashScreen();
        }
    },
    deviceReady: function() {
        // Hide splash screen if the App has been rendered yet
        if (this.hasNode()) {
            this.hideSplashScreen();
        }
        // Check if the app has been intitialized yet. Necessary since deviceready event
        // seems to be fired multiple times
        if (!this.initialized) {
            this.init();
            this.initialized = true;
        }
    },
    init: function() {
        if (App.isMobile()) {
            var toolbar = cordova.require('cordova/plugin/keyboard_toolbar_remover');
            toolbar.hide();
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

        this.history = [["feed/"]];

        chuisy.notifications.on("reset", function() {
            if (App.isMobile()) {
                window.plugins.pushNotification.setApplicationIconBadgeNumber(chuisy.notifications.meta.unseen_count, function() {});
            }
        });

        if (App.isMobile()) {
            this.registerDevice();
            this.initPushNotifications();
        }

        // var firstLaunched = localStorage.getItem("chuisy.firstLaunched");

        if (!App.isSignedIn()) {
            this.$.signInView.setSuccessCallback(enyo.bind(this, function() {
                this.$.mainView.openView("getstarted", null, true);
                this.$.signInView.setCancelButtonLabel($L("Cancel"));
            }));
            this.$.signInView.setFailureCallback(enyo.bind(this, function() {
                this.$.mainView.openView("feed", null, true);
                this.$.signInView.setCancelButtonLabel($L("Cancel"));
            }));
            this.$.signInView.setCancelButtonLabel($L("Skip"));
            this.$.signInView.ready();
            // this.$.signInSlider.setValue(0);
        } else {
            this.recoverStateFromUri();
            this.signInViewDone();
            setTimeout(enyo.bind(this, function() {
                this.$.signInView.ready();
            }), 500);
        }

        // Update the version number in localstorage
        localStorage.setItem("chuisy.version", App.version);
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
                this.navigateTo(notification.uri);
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
        return true;
    },
    offline: function() {
        this.log("offline");
        chuisy.setOnline(false);
        return true;
    },
    resume: function() {
        this.checkPendingNotifications();
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
            this.navigateTo(match[1]);
        } else {
            this.navigateTo("feed/");
        }
    },
    /**
        Scans _uri_ for certain patterns and opens corresponding content if possible
    */
    navigateTo: function(uri, obj) {
        if ((match2 = uri.match(/^auth\/(.+)/))) {
            // auth/{base64-encoded auth credentials}
            // The user has been redirected from the backend with authentication credentials. Let's sign him in.
            chuisy.authCredentials = JSON.parse(Base64.decode(match2[1]));
            chuisy.savePersistentObject("authCredentials", chuisy.authCredentials);
            this.signedIn();
            App.updateHistory("");
        } else if (uri.match(/^feed\/$/)) {
            // chufeed/
            // The chu feed it is! Let't open it.
            this.$.mainView.openView("feed");
        } else if (uri.match(/^discover\/$/)) {
            // discover/
            // Lets discover some stuff!
            this.$.mainView.openView("discover");
        } else if (uri.match(/^profile\/$/) || uri.match(/^me\/$/)) {
            // chubox/
            // User wants to see his Chu Box? Our pleasure!
            this.$.mainView.openView("profile");
        } else if (uri.match(/^settings\/$/) || uri.match(/^me\/$/)) {
            // settings/
            // Open settings view
            this.$.mainView.openView("settings");
        } else if (uri.match(/^closet\/$/)) {
            // chubox/
            // User wants to see his Chu Box? Our pleasure!
            this.$.mainView.openView("closet");
        } else if (uri.match(/^gifts\/$/)) {
            // chubox/
            // Whats new? Let's check out the notifications
            this.$.mainView.openView("gifts");
        } else if ((match2 = uri.match(/^gift\/(\d+)\/$/))) {
            // {user id}/
            // This is the URI to a users profile
            if (obj) {
                // A gift object has been provided. So we can open it directly.
                var gift = obj instanceof chuisy.models.Gift ? obj : new chuisy.models.Gift(obj);
                this.$.mainView.openView("gift", gift);
            } else if (App.checkConnection()) {
                var gift = new chuisy.models.Gift({id: match2[1]});
                gift.fetch();
                this.$.mainView.openView("gift", gift);
            }
        // } else if ((match2 = uri.match(/^user\/(\d+)\/chubox\/$/))) {
        //     // {user id}/
        //     // This is the URI to a users profile
        //     chuisy.user.detail(match2[1], enyo.bind(this, function(sender, response) {
        //         this.$.mainView.openView(response);
        //     }));
        } else if (uri.match(/^notifications\/$/)) {
            // chubox/
            // Whats new? Let's check out the notifications
            this.$.mainView.openView("notifications");
        } else if ((match2 = uri.match(/^chu\/(.+)$/))) {
            // chu/..
            if (match2[1].match(/new\/$/)) {
                // chu/new/
                // Always glad to see new Chus. Let's open an empty chu view.
                this.$.mainView.composeChu();
            } else if ((match3 = match2[1].match(/^(\d+)\/$/))) {
                // chu/{chu id}

                if (obj) {
                    // A chu object has been provided. So we can open it directly.
                    var chu = obj instanceof chuisy.models.Chu ? obj : new chuisy.models.Chu(obj);
                    this.$.mainView.openView("chu", chu);
                } else if (App.checkConnection()) {
                    // We don't have a chu object, but we do have an id. Let's fetch it!
                    var chu = new chuisy.models.Chu({id: match3[1]});
                    chu.fetch();
                    this.$.mainView.openView("chu", chu);
                }
            }
        } else if ((match2 = uri.match(/^user\/(\d+)\/$/))) {
            // {user id}/
            // This is the URI to a users profile
            if (obj) {
                // A user object has been provided. So we can open it directly.
                var user = obj instanceof chuisy.models.User ? obj : new chuisy.models.User(obj);
                this.$.mainView.openView("user", user);
            } else if (App.checkConnection()) {
                var user = new chuisy.models.User({id: match2[1]});
                user.fetch();
                this.$.mainView.openView("user", user);
            }
        // } else if ((match2 = uri.match(/^user\/(\d+)\/chubox\/$/))) {
        //     // {user id}/
        //     // This is the URI to a users profile
        //     chuisy.user.detail(match2[1], enyo.bind(this, function(sender, response) {
        //         this.$.mainView.openView(response);
        //     }));
        } else {
            this.log("Uri hash provided but no known pattern found!");
            // TODO: Show 404 Page
            this.$.mainView.openView("feed");
        }
    },
    /**
        Adds current context to navigation history.
    */
    updateHistory: function(sender, event) {
        this.history.push([event.uri, event.obj]);
        window.location.hash = "!/" + event.uri;
    },
    /**
        Removes the latest context from the history and opens the previous one
    */
    back: function() {
        if (this.history.length > 1) {
            this.history.pop();
            this.navigateTo.apply(this, this.history[this.history.length-1]);
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
        // this.$.signInSlider.animateToMin();
        this.$.signInView.addClass("showing");
    },
    signInViewDone: function() {
        // this.$.signInSlider.animateToMax();
        this.$.signInView.removeClass("showing");
    },
    mainViewNavigateTo: function(sender, event) {
        this.navigateTo(event.uri, event.obj);
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
    components: [
        {kind: "MainView", classes: "enyo-fill", onUpdateHistory: "updateHistory", onBack: "back", onNavigateTo: "mainViewNavigateTo"},
        // FACEBOOK SIGNIN
        {kind: "SignInView", onDone: "signInViewDone", classes: "app-signinview showing"},
        {kind: "Guide"},
        {kind: "Signals", ondeviceready: "deviceReady", ononline: "online", onoffline: "offline", onresume: "resume",
            onRequestSignIn: "requestSignIn", onShowGuide: "showGuide"}
    ]
});
