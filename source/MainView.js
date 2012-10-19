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
        profileView: 4,
        settings: 5,
        composeChu: 6
    },
    events: {
        onLogout: ""
    },
    isNarrow: function() {
        return this.getBounds().width < this.narrowWidth;
    },
    userChanged: function() {
        this.$.chuboxView.setUser(this.user);
        this.$.chuFeed.setUser(this.user);
        this.$.chuView.setUser(this.user);
        this.$.chuboxItemView.setUser(this.user);
        this.$.profileView.setUser(this.user);
        this.$.settings.setUser(this.user);
        this.$.composeChu.setUser(this.user);
    },
    showView: function(name) {
        this.$.primaryPanels.setIndex(this.views[name]);
    },
    openChuFeed: function() {
        this.showView("chuFeed");
        this.$.chuFeed.loadChus();

        this.$.chuFeedMenuItem.addClass("selected");
        this.$.chuboxMenuItem.removeClass("selected");
        this.$.postChuMenuItem.removeClass("selected");
        this.$.profileMenuItem.removeClass("selected");
        this.$.settingsMenuItem.removeClass("selected");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chufeed/");
    },
    openChubox: function() {
        this.showView("chubox");
        this.$.chuFeedMenuItem.removeClass("selected");
        this.$.chuboxMenuItem.addClass("selected");
        this.$.postChuMenuItem.removeClass("selected");
        this.$.profileMenuItem.removeClass("selected");
        this.$.settingsMenuItem.removeClass("selected");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chubox/");
    },
    openChuView: function(chu) {
        this.$.chuView.setChu(chu);
        this.showView("chuView");

        this.$.chuFeedMenuItem.removeClass("selected");
        this.$.chuboxMenuItem.removeClass("selected");
        this.$.postChuMenuItem.addClass("selected");
        this.$.profileMenuItem.removeClass("selected");
        this.$.settingsMenuItem.removeClass("selected");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chu/" + chu.id + "/");
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
        this.$.settingsMenuItem.removeClass("selected");

        this.$.mainSlider.animateToMin();

        App.updateHistory("user/" + user.id + "/");
    },
    openSettings: function() {
        this.showView("settings");

        this.$.chuFeedMenuItem.removeClass("selected");
        this.$.chuboxMenuItem.removeClass("selected");
        this.$.postChuMenuItem.removeClass("selected");
        this.$.profileMenuItem.removeClass("selected");
        this.$.settingsMenuItem.addClass("selected");

        this.$.mainSlider.animateToMin();

        App.updateHistory("settings/");
    },
    composeChu: function() {
        this.$.composeChu.clear();
        this.showView("composeChu");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chu/new/");
    },
    openProfile: function() {
        this.openProfileView(this.user);
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
    chuViewBack: function() {
        this.openChuFeed();
    },
    composeChuBack: function() {
        this.openChuFeed();
    },
    toggleMenu: function() {
        this.$.mainSlider.toggleMinMax();
    },
    components: [
        {classes: "mainmenu", components: [
            {classes: "mainmenu-item", ontap: "openChuFeed", name: "chuFeedMenuItem", components: [
                {kind: "onyx.Icon", src: "assets/images/home_light.png", classes: "mainmenu-item-icon"},
                {classes: "mainmenu-item-text", content: "Chu Feed"}
            ]},
            {classes: "mainmenu-item", ontap: "openChubox", name: "chuboxMenuItem", components: [
                {kind: "onyx.Icon", src: "assets/images/archive_light.png", classes: "mainmenu-item-icon"},
                {classes: "mainmenu-item-text", content: "Chu Box"}
            ]},
            {classes: "mainmenu-item", ontap: "openProfile", name: "profileMenuItem", components: [
                {kind: "onyx.Icon", src: "assets/images/user_light.png", classes: "mainmenu-item-icon"},
                {classes: "mainmenu-item-text", content: "Profile"}
            ]},
            {classes: "mainmenu-item", ontap: "openSettings", name: "settingsMenuItem", components: [
                {kind: "onyx.Icon", src: "assets/images/setting_light.png", classes: "mainmenu-item-icon"},
                {classes: "mainmenu-item-text", content: "Settings"}
            ]},
            {classes: "mainmenu-item", ontap: "composeChu", name: "postChuMenuItem", components: [
                {kind: "onyx.Icon", src: "assets/images/photo-album_light.png", classes: "mainmenu-item-icon"},
                {classes: "mainmenu-item-text", content: "Post Chu"}
            ]}
        ]},
        {kind: "Slideable", name: "mainSlider", classes: "mainslider enyo-fill", unit: "px", min: 0, max: 200, overMoving: false, components: [
            {kind: "Panels", arrangerKind: "CardArranger", draggable: false, classes: "enyo-fill", name: "primaryPanels", components: [
                {kind: "ChuFeed", onChuSelected: "chuSelected", onToggleMenu: "toggleMenu"},
                {kind: "ChuboxView", onItemSelected: "chuboxItemSelected", onToggleMenu: "toggleMenu"},
                {kind: "NarrowChuView", name: "chuView", onBack: "chuViewBack", onItemSelected: "chuboxItemSelected"},
                {kind: "ChuboxItemView"},
                {kind: "ProfileView", onChuSelected: "chuSelected", onToggleMenu: "toggleMenu"},
                {kind: "Settings", onLogout: "doLogout", onToggleMenu: "toggleMenu"},
                {kind: "ComposeChu", onBack: "composeChuBack"}
            ]}
        ]}
    ]
});