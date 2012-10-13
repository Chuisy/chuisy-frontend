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

        chuisy.authCredentials = this.fetchAuthCredentials();
        if (chuisy.authCredentials) {
            this.signedIn();
        }

        window.onhashchange = enyo.bind(this, this.recoverStateFromUri);
        this.recoverStateFromUri();
    },
    /**
        Scans uri for certain patterns and recovers the corresponding application state
    */
    recoverStateFromUri: function() {
        if (!window.ignoreHashChange) {
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
                } else if (match[1].match(/^chubox\/$/)) {
                    // chubox/
                    // User wants to see his Chu Box? Our pleasure!
                    this.$.mainView.openChubox();
                } else if ((match2 = match[1].match(/^chu\/(.+)$/))) {
                    // chu/..
                    if (match2[1].match(/new\/$/)) {
                        // chu/new/
                        // Always glad to see new Chus. Let's open an empty chu view.
                        this.$.mainView.openChuView(null);
                    } else if ((match3 = match2[1].match(/^(\d+)\/$/))) {
                        // chu/{chu id}
                        // We have a URI pointing to a specific Chu. Let's open it.
                        chuisy.chu.detail(match3[1], enyo.bind(this, function(sender, response) {
                            this.$.mainView.openChuView(response);
                        }));
                    } else if ((match3 = match2[1].match(/^(\d+)\/item\/(\d+)\/$/))) {
                        // chu/{chu id}/item/{item id}/
                        // This is a Chubox Item within a certain Chu. Let's open the ChuboxItemView with a Chu specified
                        chuisy.chu.detail(match3[1], enyo.bind(this, function(sender, response) {
                            var item;
                            // Find the right item inside the chu's item array
                            for (var i=0; i<response.items.length; i++) {
                                if (response.items[i].id == match3[2]) {
                                    item = response.items[i];
                                    break;
                                }
                            }
                            this.$.mainView.openChuboxItemView(item, response);
                        }));
                    }
                } else if ((match2 = match[1].match(/^item\/(\d+)\/$/))) {
                    // item/{item id}
                    // A specific Chubox Item. Let's open the ChuboxItemView without a Chu
                    chuisy.chuboxitem.detail(match2[1], enyo.bind(this, function(sender, response) {
                        this.$.mainView.openChuboxItemView(response);
                    }));
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
                }
            }
        }

        window.ignoreHashChange = false;
    },
    loadUserData: function() {
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
        this.saveAuthCredentials();
        this.loadUserData();
        this.$.panels.setIndex(1);
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
        this.$.panels.setIndex(0);
        App.updateHistory("");
    },
    components: [
        {kind: "Panels", draggable: false, classes: "enyo-fill", components: [
            {kind: "StartPage", onSignIn: "signedIn"},
            {kind: "MainView", classes: "enyo-fill", onLogout: "logout"}
        ]}
    ]
});
