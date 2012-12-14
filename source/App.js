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
            Checks if app is running in a mobile browser
        */
        isMobile: function() {
            return navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/);
        }
    },
    create: function() {
        this.inherited(arguments);

        // If app is running with Cordova, init will be called after the deviceready event
        if (!App.isMobile()) {
            this.init();
        }
    },
    rendered: function() {
        this.inherited(arguments);

        // Hide splash screen if Cordova has been loaded yet
        if (navigator.splashscreen) {
            navigator.splashscreen.hide();
        }
    },
    deviceReady: function() {
        // Hide splash screen if the App has been rendered yet
        if (this.hasNode()) {
            navigator.splashscreen.hide();
        }
        // Check if the app has been intitialized yet. Necessary since deviceready event
        // seems to be fired multiple times
        if (!this.initialized) {
            this.init();
            this.initialized = true;
        }
    },
    init: function() {
        // Gotta load the facebook js sdk unless we are running with Cordova
        if (!App.isMobile()) {
            this.initFacebookWeb();
        }

        // window.onhashchange = enyo.bind(this, this.hashChanged);
        chuisy.init();

        enyo.Signals.send("onUserChanged", {user: chuisy.getSignInStatus().user});

        enyo.Signals.send(App.isOnline() ? "ononline" : "onoffline");

        this.history = [];

        this.recoverStateFromUri();

        if (App.isMobile()) {
            this.initPushNotifications();
        }
    },
    /**
        Checks any pending notifications and adds event listener for new push notifications
    */
    initPushNotifications: function() {
        var pushNotification = window.plugins.pushNotification;

        this.checkPendingNotifications();
        document.addEventListener('onPushNotification', enyo.bind(this, function(event) {
            // this.log(JSON.stringify(event.notification));
            pushNotification.setApplicationIconBadgeNumber(event.notification.aps.badge, function() {});
            enyo.Signals.send("onPushNotification", event);
        }));
    },
    /**
        Registers device with apns and add it to the users account
    */
    registerDevice: function() {
        try {
            window.plugins.pushNotification.registerDevice({alert:true, badge:true, sound:true}, enyo.bind(this, function(status) {
                // this.log(JSON.stringify(status));
                if (status.enabled && status.deviceToken) {
                    chuisy.device.add({token: status.deviceToken}, enyo.bind(this, function(sender, response) {
                    }));
                }
            }));
        } catch (e) {
            console.error("Could not register device! Error: " + e.message);
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
        if (chuisy.getSignInStatus().signedIn) {
            chuisy.loadUserDetails();
        }
        if (App.isMobile() && chuisy.getSignInStatus().signedIn) {
            this.registerDevice();
        }
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
    signedIn: function() {
        if (App.isOnline()) {
            this.registerDevice();
        }
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
    navigateTo: function(uri) {
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
        } else if (uri.match(/^chubox\/$/)) {
            // chubox/
            // User wants to see his Chu Box? Our pleasure!
            this.$.mainView.openView("chubox");
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
                // We have a URI pointing to a specific Chu. Let's open it.
                chuisy.chu.detail(match3[1], enyo.bind(this, function(sender, response) {
                    this.$.mainView.openChuView(response);
                }));
            }
        } else if ((match2 = uri.match(/^user\/(\d+)\/$/))) {
            // {user id}/
            // This is the URI to a users profile
            chuisy.user.detail(match2[1], enyo.bind(this, function(sender, response) {
                this.$.mainView.openProfileView(response);
            }));
        } else if ((match2 = uri.match(/^user\/(\d+)\/chubox\/$/))) {
            // {user id}/
            // This is the URI to a users profile
            chuisy.user.detail(match2[1], enyo.bind(this, function(sender, response) {
                this.$.mainView.openChubox(response);
            }));
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
        this.history.push(event.uri);
        window.location.hash = "!/" + event.uri;
    },
    /**
        Removes the latest context from the history and opens the previous one
    */
    back: function() {
        if (this.history.length > 1) {
            this.history.pop();
            this.navigateTo(this.history[this.history.length-1]);
            // This view is already in the history so we gotta remove it or it will be there twice
            this.history.pop();
        }
    },
    /**
        Gets a facebook access token and exchanges it for Chuisy api authentication credentials
    */
    facebookSignIn: function() {
        // Get facebook access token
        this.loginWithFacebook(enyo.bind(this, function(accessToken) {
            chuisy.signIn({fb_access_token: accessToken}, enyo.bind(this, function() {
                if (this.signInSuccessCallback) {
                    this.signInSuccessCallback();
                    this.signInSuccessCallback = null;
                    this.signInFailureCallback = null;
                }
                this.$.panels.setIndex(0);
            }), enyo.bind(this, function() {
                alert("Authentication failed!");
            }));
        }));
    },
    /**
        Retrieves a facebook access token from the appropriate sdk and calls _callback_ with the result
    */
    loginWithFacebook: function(callback) {
        if (window.plugins && window.plugins.facebookConnect) {
            window.plugins.facebookConnect.login({permissions: ["email", "user_about_me", "user_birthday", "user_location", "user_website"], appId: "180626725291316"}, enyo.bind(this, function(result) {
                if(result.cancelled || result.error) {
                    this.log("Facebook signin failed:" + result.message);
                    return;
                }
                callback(result.accessToken);
            }));
        } else if (FB) {
            FB.login(function() {
                if (response.status == "connected") {
                    callback(response.authResponse.accessToken);
                } else {
                    console.log("Facebook signin failed!");
                }
            }, {scope: "user_birthday,user_location,user_about_me,user_website,email"});
        } else {
            this.error("No facebook sdk found!");
        }
    },
    facebookCancel: function() {
        if (this.signInFailureCallback) {
            this.signInFailureCallback();
            this.signInSuccessCallback = null;
            this.signInFailureCallback = null;
        }
        this.$.panels.setIndex(0);
    },
    requestSignIn: function(sender, event) {
        this.signInSuccessCallback = event.success;
        this.signInFailureCallback = event.failure;
        this.$.panels.setIndex(1);
    },
    mainViewNavigateTo: function(sender, event) {
        this.navigateTo(event.uri);
    },
    components: [
        {kind: "Panels", draggable: false, arrangerKind: "CarouselArranger", classes: "enyo-fill", components: [
            {kind: "MainView", classes: "enyo-fill", onUpdateHistory: "updateHistory", onBack: "back", onNavigateTo: "mainViewNavigateTo"},
            {classes: "enyo-fill", components: [
                {kind: "onyx.Button", content: "Sign in with Facebook", ontap: "facebookSignIn"},
                {kind: "onyx.Button", content: "Cancel", ontap: "facebookCancel"}
            ]}
        ]},
        {kind: "Signals", ondeviceready: "deviceReady", ononline: "online", onoffline: "offline", onresume: "resume", onRequestSignIn: "requestSignIn", onSignInSuccess: "signedIn"}
    ]
});
