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
        composeChu: 6,
        composeChuboxItem: 7
    },
    events: {
        onLogout: ""
    },
    isNarrow: function() {
        return this.getBounds().width < this.narrowWidth;
    },
    create: function() {
        this.inherited(arguments);
        this.$.primaryPanels.getAnimator().setDuration(1000);
    },
    userChanged: function() {
        this.$.chuboxView.setUser(this.user);
        this.$.chuFeed.setUser(this.user);
        this.$.chuView.setUser(this.user);
        this.$.chuboxItemView.setUser(this.user);
        this.$.profileView.setUser(this.user);
        this.$.settings.setUser(this.user);
        this.$.composeChu.setUser(this.user);
        this.$.composeChuboxItem.setUser(this.user);
    },
    showView: function(name) {
        this.$.primaryPanels.setIndex(this.views[name]);
    },
    openChuFeed: function() {
        this.showView("chuFeed");
        this.$.chuFeed.loadChus();

        this.$.mainSlider.animateToMin();

        App.updateHistory("chufeed/");
    },
    openChubox: function() {
        this.$.chuboxView.refresh();
        this.showView("chubox");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chubox/");
    },
    openChuView: function(chu) {
        this.$.chuView.setChu(chu);
        this.showView("chuView");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chu/" + chu.id + "/");
    },
    openChuboxItemView: function(item) {
        this.$.chuboxItemView.setItem(item);
        App.updateHistory("item/" + item.id + "/");
        this.showView("chuboxItemView");

        this.$.mainSlider.animateToMin();
    },
    openProfileView: function(user) {
        this.$.profileView.setShowedUser(user);
        this.showView("profileView");

        App.updateHistory(user == "me" ? "me/": ("user/" + user.id + "/"));
    },
    showOwnProfile: function() {
        this.openProfileView("me");

        this.$.mainSlider.animateToMin();
    },
    openSettings: function() {
        this.showView("settings");

        this.$.mainSlider.animateToMin();

        App.updateHistory("settings/");
    },
    composeChu: function() {
        this.$.composeChu.initialize();
        this.showView("composeChu");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chu/new/");
    },
    composeChuboxItem: function() {
        this.$.composeChuboxItem.initialize();
        this.showView("composeChuboxItem");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chuboxitem/new/");
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
    back: function() {
        history.back();
    },
    toggleMenu: function() {
        this.$.mainSlider.toggleMinMax();
    },
    showProfile: function(sender, event) {
        this.openProfile(event.user);
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
            {classes: "mainmenu-item", ontap: "showOwnProfile", name: "profileMenuItem", components: [
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
            ]},
            {classes: "mainmenu-item", ontap: "composeChuboxItem", name: "composeChuboxItemMenuItem", components: [
                {kind: "onyx.Icon", src: "assets/images/photo-album_light.png", classes: "mainmenu-item-icon"},
                {classes: "mainmenu-item-text", content: "Add Chu Box Item"}
            ]}
        ]},
        {kind: "Slideable", name: "mainSlider", classes: "mainslider enyo-fill", unit: "px", min: 0, max: 200, overMoving: false, components: [
            {kind: "Panels", arrangerKind: "HFlipArranger", draggable: false, classes: "enyo-fill", name: "primaryPanels", components: [
                {kind: "ChuFeed", onChuSelected: "chuSelected", onToggleMenu: "toggleMenu"},
                {kind: "ChuboxView", onItemSelected: "chuboxItemSelected", onToggleMenu: "toggleMenu"},
                {kind: "ChuView", name: "chuView", onBack: "back", onItemSelected: "chuboxItemSelected"},
                {kind: "ChuboxItemView", onBack: "back"},
                {kind: "ProfileView", onChuSelected: "chuSelected", onToggleMenu: "toggleMenu", onChuboxItemSelected: "chuboxItemSelected", onShowProfile: "showProfile", onBack: "back"},
                {kind: "Settings", onLogout: "doLogout", onToggleMenu: "toggleMenu"},
                {kind: "ComposeChu", onBack: "back"},
                {kind: "ComposeChuboxItem", onBack: "back"}
            ]}
        ]}
    ]
});