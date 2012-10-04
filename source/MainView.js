enyo.kind({
    name: "MainView",
    classes: "mainview",
    kind: "FittableRows",
    narrowWidth: 800,
    published: {
        // menuShowing: true,
        // infoSliderShowing: true,
        user: null
    },
    views: {
        chuFeed: 0,
        chubox: 1,
        chuView: 2,
        chuboxItemView: 3,
        profileView: 4
    },
    isNarrow: function() {
        return this.getBounds().width < this.narrowWidth;
    },
    userChanged: function() {
        this.$.chubox.setUser(this.user);
        this.$.chubox.setBoxOwner(this.user);
        this.$.chuFeed.setUser(this.user);
        this.$.chuView.setUser(this.user);
        this.$.chuboxItemView.setUser(this.user);
        this.$.profileView.setUser(this.user);
    },
    showView: function(name) {
        this.$.primaryPanels.setIndex(this.views[name]);
    },
    openChuFeed: function() {
        this.showView("chuFeed");
        this.$.chuFeedMenuItem.addClass("selected");
        this.$.chuboxMenuItem.removeClass("selected");
        this.$.postChuMenuItem.removeClass("selected");
        this.$.profileMenuItem.removeClass("selected");
    },
    openChubox: function() {
        this.showView("chubox");
        this.$.chuFeedMenuItem.removeClass("selected");
        this.$.chuboxMenuItem.addClass("selected");
        this.$.postChuMenuItem.removeClass("selected");
        this.$.profileMenuItem.removeClass("selected");
    },
    openChuView: function(chu) {
        if (chu) {
            this.$.chuView.setChu(chu);
        } else {
            this.$.chuView.clear();
        }
        this.showView("chuView");

        this.$.chuFeedMenuItem.removeClass("selected");
        this.$.chuboxMenuItem.removeClass("selected");
        this.$.postChuMenuItem.addClass("selected");
        this.$.profileMenuItem.removeClass("selected");
    },
    openChuboxItemView: function(item, chu) {
        this.$.chuboxItemView.setItem(item);
        this.$.chuboxItemView.setChu(chu);
        if (chu) {
            this.$.chuboxItemView.setLikeable(true);
        } else {
            this.$.chuboxItemView.setLikeable(false);
        }
        this.showView("chuboxItemView");
    },
    openProfileView: function(user) {
        this.$.profileView.setShowedUser(user);
        this.showView("profileView");

        this.$.chuFeedMenuItem.removeClass("selected");
        this.$.chuboxMenuItem.removeClass("selected");
        this.$.postChuMenuItem.removeClass("selected");
        this.$.profileMenuItem.addClass("selected");
    },
    openProfile: function() {
        this.openProfileView(this.user);
    },
    postChu: function() {
        this.openChuView(null);
    },
    // menuShowingChanged: function() {
    //     this.$.menuButton.addRemoveClass("active", this.menuShowing);
    //     this.$.appPanels.setIndex(this.menuShowing ? 0 : 1);
    // },
    // infoSliderShowingChanged: function() {
    //     this.$.infoSliderButton.addRemoveClass("active", this.infoSliderShowing);
    //     if (this.infoSliderShowing) {
    //         this.$.infoSlider.animateToMin();
    //     } else {
    //         this.$.infoSlider.animateToMax();
    //     }
    // },
    // rendered: function() {
    //     this.inherited(arguments);
    //     // this.setMenuShowing(!this.isNarrow());
    //     this.resizeHandler();
    // },
    // toggleMenu: function() {
    //     this.setMenuShowing(!this.menuShowing);
    // },
    // toggleInfoSlider: function() {
    //     this.setInfoSliderShowing(!this.infoSliderShowing);
    // },
    // resizeHandler: function() {
    //     this.inherited(arguments);
    //     var narrow = this.isNarrow();
    //     this.addRemoveClass("narrow", narrow);
    //     this.$.contentPanels.setFit(!narrow);
    //     this.$.infoSlider.setMin(narrow ? -200 : 0);
    //     this.$.infoSlider.setMax(narrow ? 10 : 0);
    //     this.$.infoSliderButton.setShowing(narrow);
    //     this.$.mainPanel.render();
    //     this.setInfoSliderShowing(!narrow);
    // },
    chuboxItemSelected: function(sender, event) {
        this.openChuboxItemView(event.item, event.chu);
    },
    chuSelected: function(sender, event) {
        this.$.chuView.setUser(this.user);
        this.$.chuView.setChu(event.chu);
        this.$.primaryPanels.setIndex(2);
    },
    contentPanelsBack: function() {
        this.$.contentPanels.setIndex(0);
    },
    back: function() {
        this.openChuFeed();
    },
    components: [
        {classes: "mainheader", components: [
            {classes: "mainheader-text", content: "chuisy"}
            // {kind: "onyx.Button", name: "infoSliderButton", ontap: "toggleInfoSlider", components: [
            //  {kind: "Image", src: "assets/images/menu-icon.png"}
            // ]}
        ]},
        {kind: "FittableColumns", fit: true, components: [
            {classes: "mainmenu", components: [
                {classes: "mainmenu-item", content: "Chu Feed", ontap: "openChuFeed", name: "chuFeedMenuItem"},
                {classes: "mainmenu-item", content: "Chu Box", ontap: "openChubox", name: "chuboxMenuItem"},
                {classes: "mainmenu-item", content: "Post Chu", ontap: "postChu", name: "postChuMenuItem"},
                {classes: "mainmenu-item", content: "Profile", ontap: "openProfile", name: "profileMenuItem"}
            ]},
            {kind: "Panels", arrangerKind: "CardArranger", fit: true, draggable: false, classes: "shadow-left", name: "primaryPanels", components: [
                {kind: "ChuFeed", onChuSelected: "chuSelected"},
                {kind: "Chubox", onItemSelected: "chuboxItemSelected"},
                {kind: "ChuView", onBack: "back", onItemSelected: "chuboxItemSelected"},
                {kind: "ChuboxItemView"},
                {kind: "ProfileView"}
            ]}
        ]}
    ]
});