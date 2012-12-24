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
    history: [],
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
            } else if ((match3 = match2[1].match(/^share\/(\d+)\/$/))) {
                // chu/share/{chu id}
                // Sharing is caring. And apparently this user wants to share a chu. Let' go!
                chuisy.chu.detail(match3[1], enyo.bind(this, function(sender, response) {
                    this.$.mainView.openView("share", response);
                }));
            } else if ((match3 = match2[1].match(/^(\d+)\/$/))) {
                // chu/{chu id}
                // We have a URI pointing to a specific Chu. Let's open it.
                chuisy.chu.detail(match3[1], enyo.bind(this, function(sender, response) {
                    this.$.mainView.openView("chu", response);
                }));
            }
        } else if ((match2 = uri.match(/^user\/(\d+)\/$/))) {
            // {user id}/
            // This is the URI to a users profile
            chuisy.user.detail(match2[1], enyo.bind(this, function(sender, response) {
                this.$.mainView.openView("user", response);
            }));
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
        Sets the success and error callback specified in _event.success_ and _event.failure_ and opens the Facebook sign in dialog
    */
    requestSignIn: function(sender, event) {
        this.$.facebookSignIn.setSuccessCallback(event.success);
        this.$.facebookSignIn.setFailureCallback(event.failure);
        this.$.signInSlider.animateToMin();
    },
    facebookSignInDone: function() {
        this.$.signInSlider.animateToMax();
    },
    mainViewNavigateTo: function(sender, event) {
        this.navigateTo(event.uri);
    },
    signInSliderAnimateFinish: function(sender, event) {
        if (this.$.signInSlider.getValue() == this.$.signInSlider.getMax()) {
            // User has discarded the login dialog. Call the cancel function.
            this.$.facebookSignIn.cancel();
        }
    },
    components: [
        {kind: "MainView", classes: "enyo-fill", onUpdateHistory: "updateHistory", onBack: "back", onNavigateTo: "mainViewNavigateTo"},
        // FACEBOOK SIGNIN
        {kind: "Slideable", classes: "enyo-fill signin-slider", name: "signInSlider",
            unit: "%", max: 110, min: 0, value: 110, overMoving: false, onAnimateFinish: "signInSliderAnimateFinish", components: [
            {kind: "FacebookSignIn", classes: "enyo-fill", onDone: "facebookSignInDone"}
        ]},
        {kind: "Signals", ondeviceready: "deviceReady", ononline: "online", onoffline: "offline", onresume: "resume", onRequestSignIn: "requestSignIn", onSignInSuccess: "signedIn"}
    ]
});
