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
        this.showView("chuView");
        this.$.chuView.setChu(chu);

        this.doUpdateHistory({uri: "chu/" + chu.id + "/"});
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
        this.showView("share");
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
                    {kind: "ProfileView", onShowChu: "showChu", onShowProfile: "showProfile", user: "me"},
                    {kind: "Discover", onShowProfile: "showProfile", onShowChu: "showChu"},
                    {content: "GIFTS"},
                    {kind: "Notifications", onNotificationSelected: "notificationSelected"}
                ]}
            ]},
            {kind: "Settings"},
            {kind: "ComposeChu", onBack: "back", onDone: "composeChuDone"},
            {kind: "ChuView", name: "chuView", onShare: "shareChu", onShowProfile: "showProfile"},
            {kind: "ShareView", onBack: "shareViewDone", onDone: "shareViewDone"}
        ]}
    ]
});