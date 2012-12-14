enyo.kind({
    name: "MainView",
    classes: "mainview",
    events: {
        onUpdateHistory: "",
        onBack: "",
        onNavigateTo: ""
    },
    views: {
        feed: 0,
        chubox: 1,
        profile: 2,
        settings: 3,
        discover: 4,
        chuView: 5,
        notifications: 6,
        composeChu: 7,
        share: 8
    },
    userChanged: function(sender, event) {
        this.user = event.user;
        if (this.user) {
            this.$.menuAvatar.applyStyle("background-image", "url(" + this.user.profile.avatar + ")");
            this.$.menuName.setContent(event.user.first_name + " " + event.user.last_name);
        } else {
            this.$.menuAvatar.applyStyle("background-image", "url(assets/images/avatar_placeholder.png");
            this.$.menuName.setContent("");
        }
    },
    showView: function(name) {
        this.$.primaryPanels.setIndex(this.views[name]);
    },
    openFeed: function() {
        this.showView("feed");

        this.$.mainSlider.animateToMin();

        this.doUpdateHistory({uri: "feed/"});
    },
    openChubox: function() {
        this.showView("chubox");
        this.$.mainSlider.animateToMin();

        this.doUpdateHistory({uri: "chubox/"});
    },
    openChuView: function(chu) {
        this.showView("chuView");
        this.$.chuView.setChu(chu);

        this.$.mainSlider.animateToMin();

        this.doUpdateHistory({uri: "chu/" + chu.id + "/"});
    },
    openProfileView: function(user) {
        this.$.profileView.setUser(user);
        this.showView("profile");

        this.$.mainSlider.animateToMin();

        this.doUpdateHistory({uri: user == "me" ? "me/" : ("user/" + user.id + "/")});
    },
    profileMenuItemTapped: function() {
        this.$.mainSlider.animateToMin();

        if (chuisy.getSignInStatus().signedIn) {
            this.showOwnProfile();
        } else {
            enyo.Signals.send("onRequestSignIn", {
                success: enyo.bind(this, this.showOwnProfile)
            });
        }
    },
    showOwnProfile: function() {
        this.openProfileView("me");
    },
    openSettings: function(sender, event) {
        this.showView("settings");

        this.$.mainSlider.animateToMin();

        this.doUpdateHistory({uri: "settings/"});

        if (event) {
            event.preventDefault();
        }
    },
    composeChu: function() {
        this.$.composeChu.initialize();
        this.showView("composeChu");

        this.$.mainSlider.animateToMin();

        this.doUpdateHistory({uri: "chu/new/"});
    },
    showChu: function(sender, event) {
        this.openChuView(event.chu);
    },
    back: function() {
        this.doBack();
        return true;
    },
    toggleMenu: function() {
        this.$.mainSlider.toggleMinMax();

        if (event) {
            event.preventDefault();
        }
    },
    showProfile: function(sender, event) {
        this.openProfileView(event.user);
    },
    showNotifications: function() {
        this.showView("notifications");
        this.$.notifications.read();

        this.doUpdateHistory({uri: "notifications/"});
    },
    isSliderOpen: function() {
        return this.$.mainSlider.getValue() == this.$.mainSlider.getMax();
    },
    notificationSelected: function(sender, event) {
        this.doNavigateTo({uri: event.notification.uri});
    },
    shareChu: function(sender, event) {
        this.$.shareView.setChu(event.chu);
        this.showView("share");
    },
    openDiscover: function() {
        this.showView("discover");

        this.$.mainSlider.animateToMin();

        this.doUpdateHistory({uri: "discover/"});
    },
    shareViewDone: function(sender, event) {
        this.openChuView({chu: sender.getChu()});
    },
    composeChuDone: function(sender, event) {
        this.openFeed();
        this.$.feed.loadFeed();
    },
    components: [
        {classes: "mainmenu", components: [
            {components: [
                {classes: "mainmenu-avatar", name: "menuAvatar", components: [
                    {classes: "mainmenu-name", name: "menuName"}
                ]},
                {classes: "mainmenu-item", ontap: "openFeed", name: "feedMenuItem", components: [
                    {classes: "mainmenu-item-icon feed"},
                    {classes: "mainmenu-item-text", content: "Feed"}
                ]},
                {classes: "mainmenu-item", ontap: "openChubox", name: "chuboxMenuItem", components: [
                    {classes: "mainmenu-item-icon chubox"},
                    {classes: "mainmenu-item-text", content: "Chu Box"}
                ]},
                {classes: "mainmenu-item", ontap: "profileMenuItemTapped", name: "profileMenuItem", components: [
                    {classes: "mainmenu-item-icon profile"},
                    {classes: "mainmenu-item-text", content: "Profile"}
                ]},
                {classes: "mainmenu-item", ontap: "openSettings", name: "settingsMenuItem", components: [
                    {classes: "mainmenu-item-icon settings"},
                    {classes: "mainmenu-item-text", content: "Settings"}
                ]},
                {classes: "mainmenu-item", ontap: "openDiscover", name: "searchMenuItem", components: [
                    {classes: "mainmenu-item-icon search"},
                    {classes: "mainmenu-item-text", content: "Search"}
                ]}
            ]}
        ]},
        {kind: "Slideable", name: "mainSlider", classes: "mainslider enyo-fill", unit: "px", min: 0, max: 270, overMoving: false, onAnimateFinish: "sliderAnimateFinish", components: [
            {kind: "Panels", arrangerKind: "CardArranger", animate: false, draggable: false, classes: "enyo-fill", name: "primaryPanels", components: [
                {kind: "Feed", onShowChu: "showChu", onToggleMenu: "toggleMenu", onComposeChu: "composeChu", onShowProfile: "showProfile", onShowNotifications: "showNotifications"},
                {kind: "ChuBox", name: "chubox", onShowChu: "showChu", onToggleMenu: "toggleMenu", onComposeChu: "composeChu", onShowNotifications: "showNotifications"},
                {kind: "ProfileView", onShowChu: "showChu", onToggleMenu: "toggleMenu", onShowProfile: "showProfile", onBack: "back", onShowNotifications: "showNotifications"},
                {kind: "Settings", onToggleMenu: "toggleMenu", onShowNotifications: "showNotifications"},
                {kind: "Discover", onShowProfile: "showProfile", onShowChu: "showChu", onToggleMenu: "toggleMenu", onShowNotifications: "showNotifications"},
                {kind: "ChuView", name: "chuView", onShowNotifications: "showNotifications", onShare: "shareChu", onShowProfile: "showProfile"},
                {kind: "Notifications", onBack: "back", onNotificationSelected: "notificationSelected"},
                {kind: "ComposeChu", onBack: "back", onDone: "composeChuDone"},
                {kind: "ShareView", onBack: "shareViewDone", onDone: "shareViewDone"}
            ]}
        ]},
        {kind: "enyo.Signals", onUserChanged: "userChanged"}
    ]
});