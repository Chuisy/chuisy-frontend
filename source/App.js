enyo.kind({
    name: "App",
    fit: true,
    kind: "FittableRows",
    classes: "app",
    narrowWidth: 800,
    published: {
        user: null
    },
    create: function() {
        this.inherited(arguments);

        chuisy.authCredentials = this.fetchAuthCredentials();
        if (chuisy.authCredentials) {
            this.signedIn();
        }

        this.decodeHash();
    },
    decodeHash: function() {
        var match, hash = window.location.hash;

        if ((match = hash.match(/^#!\/(.+)/))) {
            if ((match = match[1].match(/^auth\/(.+)/))) {
                chuisy.authCredentials = JSON.parse(Base64.decode(match[1]));
                this.signedIn();
                window.location.hash = "";
            } else if ((match = match[1].match(/^chubox\/$/))) {
                this.$.mainView.showChuBox();
            }
        }
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
    components: [
        {kind: "Panels", classes: "enyo-fill", components: [
            {kind: "StartPage", onSignIn: "signedIn"},
            {kind: "MainView"}
        ]}
    ]
});
