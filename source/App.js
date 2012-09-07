enyo.kind({
    name: "App",
    fit: true,
    kind: "FittableRows",
    classes: "app",
    narrowWidth: 800,
    published: {
        menuShowing: true,
        infoSliderShowing: true,
        user: null
    },
    create: function() {
        this.inherited(arguments);
        this.decodeHash();
    },
    decodeHash: function() {
        var match, hash = window.location.hash;

        if ((match = hash.match(/^#!\/(.+)/))) {
            if ((match = match[1].match(/^auth\/(.+)/))) {
                chuisy.authCredentials = JSON.parse(Base64.decode(match[1]));
                this.saveAuthCredentials();
                this.loadUserData();
                window.location.hash = "";
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
    userChanged: function() {
        this.log(this.user);
    },
    isNarrow: function() {
        return this.getBounds().width < this.narrowWidth;
    },
    menuShowingChanged: function() {
        this.$.menuButton.addRemoveClass("active", this.menuShowing);
        this.$.appPanels.setIndex(this.menuShowing ? 0 : 1);
    },
    infoSliderShowingChanged: function() {
        this.$.infoSliderButton.addRemoveClass("active", this.infoSliderShowing);
        if (this.infoSliderShowing) {
            this.$.infoSlider.animateToMin();
        } else {
            this.$.infoSlider.animateToMax();
        }
    },
    rendered: function() {
        this.inherited(arguments);
        this.setMenuShowing(!this.isNarrow());
        this.resizeHandler();
    },
    toggleMenu: function() {
        this.setMenuShowing(!this.menuShowing);
    },
    toggleInfoSlider: function() {
        this.setInfoSliderShowing(!this.infoSliderShowing);
    },
    resizeHandler: function() {
        this.inherited(arguments);
        var narrow = this.isNarrow();
        this.addRemoveClass("narrow", narrow);
        this.$.contentPanels.setFit(!narrow);
        this.$.infoSlider.setMin(narrow ? -200 : 0);
        this.$.infoSlider.setMax(narrow ? 10 : 0);
        this.$.infoSliderButton.setShowing(narrow);
        this.$.mainPanel.render();
        this.setInfoSliderShowing(!narrow);
    },
    chuboxItemSelected: function(sender, event) {
        this.$.productView.setProduct(event.item.product);
        this.$.contentPanels.setIndex(1);
        setTimeout(enyo.bind(this, function() {
            this.$.productView.resized();
        }), 20);
    },
    contentPanelsBack: function() {
        this.$.contentPanels.setIndex(0);
    },
    facebookLogin: function() {
        window.location = "https://www.facebook.com/dialog/oauth?client_id=180626725291316&redirect_uri=http://chuisy.com:8000/v1/fb_auth/&scope=user_birthday,user_location,user_about_me";
    },
    components: [
        {classes: "main-header", kind: "FittableColumns", components: [
            {kind: "onyx.Button", classes: "active", name: "menuButton", ontap: "toggleMenu", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {classes: "main-header-text", fit: true, content: "chuisy"},
            {kind: "onyx.Button", name: "infoSliderButton", ontap: "toggleInfoSlider", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {kind: "onyx.Button", content: "Login With Facebook", ontap: "facebookLogin"}
        ]},
        {kind: "Panels", name: "appPanels", fit: true, classes: "app-panels", narrowFit: false, realtimeFit: true,
            arrangerKind: "CollapsingArranger", components: [
            {classes: "main-menu bg-light", style: "text-align: center; padding: 200px 0; font-size: 20pt;", content: "menu"},
            {classes: "main-panel bg-light", name: "mainPanel", kind: "FittableRows", components: [
                {classes: "fading-separator"},
                {kind: "FittableColumns", fit: true, components: [
                    {kind: "Panels", arrangerKind: "CardArranger", fit: false, draggable: false, style: "width: 100%", classes: "contentpanel", name: "contentPanels", components: [
                        {kind: "Chubox", onItemSelected: "chuboxItemSelected", user: {profile: {id: 2}}},
                        {kind: "Scroller", components: [
                            {kind: "ProductView", onBack: "contentPanelsBack"}
                        ]}
                    ]},
                    {kind: "Slideable", classes: "bg-light", unit: "px", overMoving: false, preventDragPropagation: true, style: "width: 200px;",
                        name: "infoSlider", components: [
                        {classes: "fading-separator"},
                        {style: "text-align: center; padding: 200px 0; font-size: 20pt;", content: "info slider"}
                    ]}
                ]}
            ]}
        ]}
    ]
});
