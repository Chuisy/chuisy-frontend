/**
    _MainView_ contains all views that contain all the relevant content
*/
enyo.kind({
    name: "MainView",
    classes: "mainview",
    kind: "FittableRows",
    events: {
        // App context has changed.
        onUpdateHistory: "",
        // User wants to go to the previous view
        onBack: "",
        // Need to navigate to a specific context url
        onNavigateTo: ""
    },
    // Mapping between view and panel index
    views: {
        feed: 0,
        chubox: 1,
        profile: 2,
        discover: 3,
        gifts: 4,
        notifications: 5
    },
    /**
        Opens the chu view with a _chu_
    */
    openChuView: function(chu) {
        this.$.superPanels.setIndex(2);
        this.$.chuView.setChu(chu);

        this.doUpdateHistory({uri: "chu/" + chu.id + "/"});
    },
    /**
        Opens the profile view of a given _user_
    */
    openProfileView: function(user) {
        this.$.profileView.setUser(user);
        this.$.superPanels.setIndex(5);

        this.doUpdateHistory({uri: "user/" + user.id + "/"});
    },
    /**
        Open compose chu view
    */
    composeChu: function() {
        this.$.composeChu.initialize();
        this.$.superPanels.setIndex(1);

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
    notificationSelected: function(sender, event) {
        this.doNavigateTo({uri: event.notification.uri});
    },
    /**
        Open share view with _event.chu_
    */
    shareChu: function(sender, event) {
        this.$.shareView.setChu(event.chu);

        this.$.superPanels.setIndex(3);
    },
    /**
        Open settings view
    */
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
    /**
        Shows panel assoziated with the key _view_ and updates the App history appropriately
    */
    openView: function(view) {
        this.$.superPanels.setIndex(0);
        this.$.mainPanels.setIndex(this.views[view]);

        this.doUpdateHistory({uri: view + "/"});

        if (view == "notifications") {
            // Mark all notifications as seen when notification view is opened
            this.$.notifications.seen();
        }
        if (view == "profile" && !chuisy.getSignInStatus().signedIn) {
            // User wants to see his profile but is not signed in yet. Ask him to sign in.
            enyo.Signals.send("onRequestSignIn", {
                failure: enyo.bind(this, this.back)
            });
        }
    },
    components: [
        {kind: "Panels", name: "superPanels", arrangerKind: "CardArranger", animate: false, draggable: false, classes: "enyo-fill", components: [
            {kind: "FittableRows", components: [
                // MENU BAR
                {kind: "Menu", onChange: "menuChanged"},
                // VIEWS THAT CAN BE REACHED VIA THE MENU BAR
                {kind: "Panels", fit: true, arrangerKind: "CardArranger", animate: false, draggable: false, name: "mainPanels", components: [
                    // CHU FEED
                    {kind: "Feed", onShowChu: "showChu", onComposeChu: "composeChu", onShowProfile: "showProfile"},
                    // CHU BOX / CLOSET
                    {kind: "ChuBox", name: "chubox", onShowChu: "showChu", onComposeChu: "composeChu"},
                    // OWN PROFILE VIEW
                    {kind: "ProfileView", name: "myProfileView", onShowChu: "showChu", onShowProfile: "showProfile", user: "me", onOpenSettings: "openSettings"},
                    // DISCOVER VIEW
                    {kind: "Discover", onShowProfile: "showProfile", onShowChu: "showChu"},
                    // GIFTS
                    {content: "GIFTS"},
                    // NOTIFICATIONS
                    {kind: "Notifications", onNotificationSelected: "notificationSelected"}
                ]}
            ]},
            // CREATE NEW CHU
            {kind: "ComposeChu", onBack: "back", onDone: "composeChuDone"},
            // DISPLAY CHU
            {kind: "ChuView", name: "chuView", onShare: "shareChu", onShowProfile: "showProfile", onBack: "back"},
            // SHARE CHU
            {kind: "ShareView", onBack: "shareViewDone", onDone: "shareViewDone"},
            // SETTINGS
            {kind: "Settings", onBack: "back"},
            // PROFILE VIEW (for other profiles)
            {kind: "FittableRows", components: [
                {classes: "header", components: [
                    {kind: "onyx.Button", ontap: "back", classes: "back-button", content: "back"}
                ]},
                {kind: "ProfileView", name: "profileView", fit: true, onShowChu: "showChu", onShowProfile: "showProfile", onOpenSettings: "openSettings"}
            ]}
        ]}
    ]
});