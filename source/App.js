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
        }
    },
    create: function() {
        this.inherited(arguments);

        if (!this.isMobile()) {
            this.initWeb();
        }
    },
    isMobile: function() {
        return navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/);
    },
    initWeb: function() {
        this.log("Initializing for web...");

        chuisy.authCredentials = this.fetchAuthCredentials();
        if (chuisy.authCredentials) {
            this.signedIn();
            this.recoverStateFromUri();
        } else {
            this.$.panels.setIndex(1);
        }

        window.fbAsyncInit = enyo.bind(this, function() {
            // init the FB JS SDK
            FB.init({
                appId      : '180626725291316', // App ID from the App Dashboard
                status     : true, // check the login status upon init?
                cookie     : true, // set sessions cookies to allow your server to access the session?
                xfbml      : true  // parse XFBML tags on this page?
            });

            // if (chuisy.authCredentials) {
            //     // Update facebook access token.
            //     this.facebookSignIn();
            // }
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
    initMobile: function() {
        if (!this.initialized) {
            this.log("Initializing for mobile...");
            // Initialize Facebook SDK
            FB.init({appId: 180626725291316, nativeInterface: CDV.FB, useCachedDialogs: false});

            // Check if user is logged in
            chuisy.authCredentials = this.fetchAuthCredentials();
            if (chuisy.authCredentials) {
                this.signedIn();
            } else {
                this.$.panels.setIndex(1);
            }

            this.initialized = true;
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
                this.signedIn();
                App.updateHistory("");
            } else if (match[1].match(/^chufeed\/$/)) {
                // chufeed/
                // The chu feed it is! Let't open it.
                this.$.mainView.openChuFeed();
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
            } else if ((match2 = match[1].match(/^item\/(.+)$/))) {
                // chu/..
                if (match2[1].match(/new\/$/)) {
                    // item/new/
                    // Add a new item to the chu box? Let's do it
                    this.$.mainView.composeChuboxItem();
                } else if ((match3 = match2[1].match(/^(\d+)\/$/))) {
                    // item/{item id}
                    // A specific Chubox Item. Let's open the ChuboxItemView without a Chu
                    chuisy.chuboxitem.detail(match3[1], enyo.bind(this, function(sender, response) {
                        this.$.mainView.openChuboxItemView(response);
                    }));
                }
            } else if ((match2 = match[1].match(/^user\/(\d+)\/$/))) {
                // {user id}/
                // This is the URI to a users profile
                chuisy.user.detail(match2[1], enyo.bind(this, function(sender, response) {
                    this.$.mainView.openProfileView(response);
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
                this.$.mainView.openChuFeed();
            }
        } else {
            this.$.mainView.openChuFeed();
        }
    },
    facebookSignIn: function() {
        // Get facebook access token
        FB.login(enyo.bind(this, function(response) {
            if (response.status == "connected") {
                chuisy.authenticate({fb_access_token: response.authResponse.accessToken}, enyo.bind(this, function(success, response) {
                    if (success) {
                        this.saveAuthCredentials();
                        this.signedIn();
                    } else {
                        alert("Authentication failed!", response);
                    }
                }));
            } else {
                alert("Facebook signin failed!");
            }
        }), {scope: "user_birthday,user_location,user_about_me,user_website,email"});
    },
    loadUser: function() {
        var credentials = this.fetchAuthCredentials();
        if (credentials) {
            chuisy.user.detail(credentials.id, enyo.bind(this, function(sender, response) {
                this.setUser(response);
            }));
        } else {
            this.setUser(null);
        }
    },
    fetchAuthCredentials: function() {
        var credentials = null;
        try {
            credentials = JSON.parse(localStorage.getItem("authCredentials"));
        } catch(e) {
        }
        return credentials;
    },
    saveAuthCredentials: function() {
        localStorage.setItem("authCredentials", JSON.stringify(chuisy.authCredentials));
    },
    deleteAuthCredentials: function() {
        localStorage.removeItem("authCredentials");
    },
    signedIn: function() {
        if (!this.user) {
            this.loadUser();
        }
        this.$.panels.setIndex(0);
        window.onhashchange = enyo.bind(this, this.hashChanged);
    },
    userChanged: function() {
        this.$.mainView.setUser(this.user);
    },
    isNarrow: function() {
        return this.getBounds().width < this.narrowWidth;
    },
    logout: function() {
        this.deleteAuthCredentials();
        this.setUser(null);
        this.$.panels.setIndex(1);
        App.updateHistory("");
    },
    components: [
        {kind: "Panels", draggable: false, arrangerKind: "CarouselArranger", classes: "enyo-fill", components: [
            {kind: "MainView", classes: "enyo-fill", onLogout: "logout"},
            {classes: "enyo-fill", components: [
                {kind: "onyx.Button", content: "Sign in with Facebook", ontap: "facebookSignIn"}
            ]}
        ]},
        {kind: "Signals", ondeviceready: "initMobile"}
    ]
});
