enyo.kind({
    name: "MainView",
    classes: "mainview",
    kind: "FittableRows",
    events: {
        onUpdateHistory: "",
        onBack: "",
        onNavigateTo: ""
    },
    views: {
        feed: 0,
        chubox: 1,
        profile: 2,
        discover: 3,
        gifts: 4,
        notifications: 5
    },
    openChuView: function(chu) {
        this.$.superPanels.setIndex(2);
        this.$.chuView.setChu(chu);

        this.doUpdateHistory({uri: "chu/" + chu.id + "/"});
    },
    openProfileView: function(user) {
        this.$.profileView.setUser(user);
        this.$.superPanels.setIndex(5);

        this.doUpdateHistory({uri: "user/" + user.id + "/"});
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

        this.$.superPanels.setIndex(3);
    },
    openSettings: function() {
        this.$.superPanels.setIndex(4);
    },
    shareViewDone: function(sender, event) {
        this.openChuView({chu: sender.getChu()});
    },
    composeChuDone: function(sender, event) {
        this.openView("feed");
        this.$.feed.loadFeed();
    },
    menuChanged: function(sender, event) {
        this.openView(event.value);
    },
    openView: function(view) {
        this.$.superPanels.setIndex(0);
        this.$.mainPanels.setIndex(this.views[view]);

        this.doUpdateHistory({uri: view + "/"});

        if (view == "notifications") {
            this.$.notifications.read();
        }
        if (view == "profile" && !chuisy.getSignInStatus().signedIn) {
            enyo.Signals.send("onRequestSignIn", {
                failure: enyo.bind(this, this.back)
            });
        }
    },
    components: [
        {kind: "Panels", name: "superPanels", arrangerKind: "CardArranger", animate: false, classes: "enyo-fill", components: [
            {kind: "FittableRows", components: [
                {kind: "Menu", onChange: "menuChanged"},
                {kind: "Panels", fit: true, arrangerKind: "CardArranger", animate: false, draggable: false, name: "mainPanels", components: [
                    {kind: "Feed", onShowChu: "showChu", onComposeChu: "composeChu", onShowProfile: "showProfile"},
                    {kind: "ChuBox", name: "chubox", onShowChu: "showChu", onComposeChu: "composeChu"},
                    {kind: "ProfileView", name: "myProfileView", onShowChu: "showChu", onShowProfile: "showProfile", user: "me", onOpenSettings: "openSettings"},
                    {kind: "Discover", onShowProfile: "showProfile", onShowChu: "showChu"},
                    {content: "GIFTS"},
                    {kind: "Notifications", onNotificationSelected: "notificationSelected"}
                ]}
            ]},
            {kind: "ComposeChu", onBack: "back", onDone: "composeChuDone"},
            {kind: "ChuView", name: "chuView", onShare: "shareChu", onShowProfile: "showProfile", onBack: "back"},
            {kind: "ShareView", onBack: "shareViewDone", onDone: "shareViewDone"},
            {kind: "Settings", onBack: "back"},
            {kind: "FittableRows", components: [
                {classes: "header", components: [
                    {kind: "onyx.Button", ontap: "back", classes: "back-button", content: "back"}
                ]},
                {kind: "ProfileView", name: "profileView", fit: true}
            ]}
        ]}
    ]
});