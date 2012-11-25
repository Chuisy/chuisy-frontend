enyo.kind({
    name: "App",
    fit: true,
    classes: "app",
    narrowWidth: 800,
    published: {
        user: null
    },
    statics: {
        updateHistory: function(uri) {
            window.ignoreHashChange = true;
            window.location.hash = "!/" + uri;
        },
        navigateTo: function(uri) {
            window.location.hash = "!/" + uri;
        },
        isOnline: function() {
            if (navigator.network && navigator.network.connection) {
                var networkState = navigator.network.connection.type;
                return networkState != Connection.UNKNOWN && networkState != Connection.NONE;
            } else {
                return true;
            }
        },
        isMobile: function() {
            return navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/);
        }
    },
    create: function() {
        this.inherited(arguments);
        if (!App.isMobile()) {
            this.init();
        }
    },
    isNarrow: function() {
        return this.getBounds().width < this.narrowWidth;
    },
    deviceReady: function() {
        if (!this.initialized) {
            this.init();
            this.initialized = true;
        }
    },
    init: function() {
        if (!App.isMobile()) {
            this.initFacebookWeb();
        }

        window.onhashchange = enyo.bind(this, this.hashChanged);
        chuisy.init();

        enyo.Signals.send("onUserChanged", {user: chuisy.getSignInStatus().user});

        enyo.Signals.send(App.isOnline() ? "ononline" : "onoffline");

        this.recoverStateFromUri();
        if (App.isMobile()) {
            this.initPushNotifications();
        }
    },
    initPushNotifications: function() {
        var pushNotification = window.plugins.pushNotification;

        this.checkPendingNotifications();
        document.addEventListener('onPushNotification', enyo.bind(this, function(event) {
            // this.log(JSON.stringify(event.notification));
            pushNotification.setApplicationIconBadgeNumber(event.notification.aps.badge, function() {});
            enyo.Signals.send("onPushNotification", event);
        }));
    },
    registerDevice: function() {
        window.plugins.pushNotification.registerDevice({alert:true, badge:true, sound:true}, enyo.bind(this, function(status) {
            // this.log(JSON.stringify(status));
            if (status.enabled && status.deviceToken) {
                chuisy.device.add({token: status.deviceToken}, enyo.bind(this, function(sender, response) {
                }));
            }
        }));
    },
    checkPendingNotifications: function() {
        window.plugins.pushNotification.getPendingNotifications(enyo.bind(this, function(pending) {
            this.log(JSON.stringify(pending));
            var notification = pending.notifications[0];
            if (notification) {
                App.navigateTo(notification.uri);
            }
        }));
    },
    initFacebookWeb: function() {
        window.fbAsyncInit = enyo.bind(this, function() {
            // init the FB JS SDK
            FB.init({
                appId      : '180626725291316', // App ID from the App Dashboard
                status     : true, // check the login status upon init?
                cookie     : true, // set sessions cookies to allow your server to access the session?
                xfbml      : true  // parse XFBML tags on this page?
            });
        });

        // Load the SDK's source Asynchronously
        this.log("Loading facebook sdk...");
        window.FB = null;
        (function(d){
            var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement('script');
            js.id = id;
            js.async = true;
            js.src = "http://connect.facebook.net/en_US/all.js";
            ref.parentNode.insertBefore(js, ref);
        }(document));
    },
    online: function() {
        this.log("online");
        chuisy.setOnline(true);
        if (chuisy.getSignInStatus().signedIn) {
            chuisy.loadUserDetails();
        }
        if (chuisy.getSignInStatus().signedIn) {
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
    hashChanged: function() {
        if (!window.ignoreHashChange) {
            this.recoverStateFromUri();
        }
        window.ignoreHashChange = false;
    },
    /**
        Scans uri for certain patterns and recovers the corresponding application state
    */
    recoverStateFromUri: function() {
        var match, match2, match3, hash = window.location.hash;
        if ((match = hash.match(/^#!\/(.+)/))) {
            // #!/...
            // Seems like there is an app state encoded in the uri. Let's see what we can find...
            if ((match2 = match[1].match(/^auth\/(.+)/))) {
                // auth/{base64-encoded auth credentials}
                // The user has been redirected from the backend with authentication credentials. Let's sign him in.
                chuisy.authCredentials = JSON.parse(Base64.decode(match2[1]));
                chuisy.savePersistentObject("authCredentials", chuisy.authCredentials);
                this.signedIn();
                App.updateHistory("");
            } else if (match[1].match(/^feed\/$/)) {
                // chufeed/
                // The chu feed it is! Let't open it.
                this.$.mainView.openFeed();
            } else if (match[1].match(/^settings\/$/)) {
                // settings/
                // Settings it is.
                this.$.mainView.openSettings();
            } else if (match[1].match(/^me\/$/)) {
                // chubox/
                // User wants to see his Chu Box? Our pleasure!
                this.$.mainView.showOwnProfile();
            } else if (match[1].match(/^chubox\/$/)) {
                // chubox/
                // User wants to see his Chu Box? Our pleasure!
                this.$.mainView.openChubox();
            } else if (match[1].match(/^notifications\/$/)) {
                // chubox/
                // Whats new? Let's check out the notifications
                this.$.mainView.showNotifications();
            } else if ((match2 = match[1].match(/^chu\/(.+)$/))) {
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
            // } else if ((match2 = match[1].match(/^item\/(.+)$/))) {
            //     // chu/..
            //     if (match2[1].match(/new\/$/)) {
            //         // item/new/
            //         // Add a new item to the chu box? Let's do it
            //         this.$.mainView.composeChuboxItem();
            //     } else if ((match3 = match2[1].match(/^(\d+)\/$/))) {
            //         // item/{item id}
            //         // A specific Chubox Item. Let's open the ChuboxItemView without a Chu
            //         chuisy.chuboxitem.detail(match3[1], enyo.bind(this, function(sender, response) {
            //             this.$.mainView.openChuboxItemView(response);
            //         }));
            //     }
            } else if ((match2 = match[1].match(/^user\/(\d+)\/$/))) {
                // {user id}/
                // This is the URI to a users profile
                chuisy.user.detail(match2[1], enyo.bind(this, function(sender, response) {
                    this.$.mainView.openProfileView(response);
                }));
            } else if ((match2 = match[1].match(/^user\/(\d+)\/chubox\/$/))) {
                // {user id}/
                // This is the URI to a users profile
                chuisy.user.detail(match2[1], enyo.bind(this, function(sender, response) {
                    this.$.mainView.openChubox(response);
                }));
            } else if ((match2 = match[1].match(/^([^\/]+)\/$/))) {
                // {username}/
                // Might be a username. Lets try finding a user that matches.

                // This doesn't work presently as the 'username' get parameter is being used for authentication
                // chuisy.user.list(["username", match2[1]], enyo.bind(this, function(sender, response) {
                //     this.log(response);
                // }));
            } else {
                this.log("Uri hash provided but no known pattern found!");
                // TODO: Show 404 Page
                this.$.mainView.openFeed();
            }
        } else {
            this.$.mainView.openFeed();
        }
    },
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
    loginWithFacebook: function(callback) {
        if (window.plugins && window.plugins.facebookConnect) {
            window.plugins.facebookConnect.login({permissions: ["email", "user_about_me", "user_birthday", "user_location", "user_website"], appId: "180626725291316"}, function(result) {
                if(result.cancelled || result.error) {
                    this.log("Facebook signin failed:" + result.message);
                    return;
                }
                callback(result.accessToken);
            });
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
    components: [
        {kind: "Panels", draggable: false, arrangerKind: "CarouselArranger", classes: "enyo-fill", components: [
            {kind: "MainView", classes: "enyo-fill"},
            {classes: "enyo-fill", components: [
                {kind: "onyx.Button", content: "Sign in with Facebook", ontap: "facebookSignIn"},
                {kind: "onyx.Button", content: "Cancel", ontap: "facebookCancel"}
            ]}
        ]},
        {kind: "Signals", ondeviceready: "deviceReady", ononline: "online", onoffline: "offline", onresume: "resume", onRequestSignIn: "requestSignIn", onSignInSuccess: "signedIn"}
    ]
});
