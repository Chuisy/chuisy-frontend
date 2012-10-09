enyo.kind({
    name: "MainView",
    classes: "mainview",
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
    events: {
        onLogout: ""
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

        this.$.mainSlider.animateToMin();

        App.updateHistory("chufeed/");
    },
    openChubox: function() {
        this.showView("chubox");
        this.$.chuFeedMenuItem.removeClass("selected");
        this.$.chuboxMenuItem.addClass("selected");
        this.$.postChuMenuItem.removeClass("selected");
        this.$.profileMenuItem.removeClass("selected");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chubox/");
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

        this.$.mainSlider.animateToMin();

        App.updateHistory("chu/" + (chu ? chu.id : "new") + "/");
    },
    openChuboxItemView: function(item, chu) {
        this.$.chuboxItemView.setItem(item);
        this.$.chuboxItemView.setChu(chu);
        if (chu) {
            this.$.chuboxItemView.setLikeable(true);
            App.updateHistory("chu/" + chu.id + "/item/" + item.id + "/");
        } else {
            this.$.chuboxItemView.setLikeable(false);
            App.updateHistory("item/" + item.id + "/");
        }
        this.showView("chuboxItemView");

        this.$.mainSlider.animateToMin();
    },
    openProfileView: function(user) {
        this.$.profileView.setShowedUser(user);
        this.showView("profileView");

        this.$.chuFeedMenuItem.removeClass("selected");
        this.$.chuboxMenuItem.removeClass("selected");
        this.$.postChuMenuItem.removeClass("selected");
        this.$.profileMenuItem.addClass("selected");

        this.$.mainSlider.animateToMin();

        App.updateHistory("user/" + user.id + "/");
    },
    openProfile: function() {
        this.openProfileView(this.user);
    },
    postChu: function() {
        this.openChuView(null);

        App.updateHistory("chu/new/");
    },
    chuboxItemSelected: function(sender, event) {
        this.openChuboxItemView(event.item, event.chu);
    },
    chuSelected: function(sender, event) {
        this.openChuView(event.chu);
    },
    contentPanelsBack: function() {
        this.$.contentPanels.setIndex(0);
    },
    back: function() {
        this.openChuFeed();
    },
    logout: function() {
        this.doLogout();
    },
    toggleMenu: function() {
        this.$.mainSlider.toggleMinMax();
    },
    components: [
        {classes: "mainmenu", components: [
            {classes: "mainmenu-item", content: "Chu Feed", ontap: "openChuFeed", name: "chuFeedMenuItem"},
            {classes: "mainmenu-item", content: "Chu Box", ontap: "openChubox", name: "chuboxMenuItem"},
            {classes: "mainmenu-item", content: "Profile", ontap: "openProfile", name: "profileMenuItem"},
            {classes: "mainmenu-item", content: "Post Chu", ontap: "postChu", name: "postChuMenuItem"},
            {classes: "mainmenu-item", content: "Logout", ontap: "logout", name: "logoutMenuItem"}
        ]},
        {kind: "Slideable", name: "mainSlider", classes: "mainslider enyo-fill", unit: "px", min: 0, max: 100, overMoving: false, components: [
            {kind: "Panels", arrangerKind: "CardArranger", draggable: false, classes: "shadow-left enyo-fill", name: "primaryPanels", components: [
                {kind: "ChuFeed", onChuSelected: "chuSelected"},
                {kind: "Chubox", onItemSelected: "chuboxItemSelected"},
                {kind: "ChuView", onBack: "back", onItemSelected: "chuboxItemSelected"},
                {kind: "ChuboxItemView"},
                {kind: "ProfileView", onChuSelected: "chuSelected"}
            ]},
            {kind: "onyx.IconButton", src: "assets/images/menu-icon.png", classes: "mainmenu-flap", ontap: "toggleMenu"}
        ]}
    ]
});