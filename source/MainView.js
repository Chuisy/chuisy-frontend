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
    // Mapping between view and panel indexes
    views: {
        feed: [0, 0],
        chubox: [0, 1],
        profile: [0, 2],
        discover: [0, 3],
        gifts: [0, 4],
        notifications: [0, 5],
        compose: [1, null],
        chu: [2, null],
        share: [3, null],
        settings: [4, null],
        user: [5, null]
    },
    back: function() {
        this.doBack();
        return true;
    },
    composeChu: function(sender, event) {
        this.openView("compose");
    },
    showChu: function(sender, event) {
        this.openView("chu", event.chu);
    },
    shareChu: function(sender, event) {
        this.openView("share", event.chu);
    },
    showUser: function(sender, event) {
        this.openView("user", event.user);
    },
    showSettings: function() {
        this.openView("settings");
    },
    notificationSelected: function(sender, event) {
        this.doNavigateTo({uri: event.notification.uri});
    },
    shareViewDone: function(sender, event) {
        this.openView("chu", sender.getChu());
    },
    composeChuDone: function(sender, event) {
        this.openView("feed");
        this.$.feed.loadFeed();
    },
    menuChanged: function(sender, event) {
        this.openView(event.value);
    },
    /**
        Trigger transition between views _from_ and _to_
    */
    transition: function(from, to) {
        var fromInd = this.views[from];
        var toInd = this.views[to];
        // var crossover = (fromInd && fromInd[0] === 0 && toInd[0] === 0) ? this.$.primaryCrossover : this.$.crossover;
        var crossover = this.$.crossover;

        crossover.applyStyle("z-index", "1000");
        crossover.addClass("shown");
        setTimeout(enyo.bind(this, function() {
            crossover.removeClass("shown");
            setTimeout(enyo.bind(this, function() {
                crossover.applyStyle("z-index", "-1000");
            }), 500);
        }), 500);
    },
    /**
        Shows panel assoziated with the key _view_ and updates the App history appropriately
    */
    openView: function(view, obj) {
        this.transition(this.currentView, view);
        var oldView = this.$[this.currentView];
        var newView = this.$[view];
        this.currentView = view;
        setTimeout(enyo.bind(this, function() {
            if (oldView) {
                oldView.deactivate();
            }
            newView.activate(obj);
            var indexes = this.views[view];
            this.$.panels.setIndex(indexes[0]);
            if (indexes[1] !== null) {
                this.$.primaryPanels.setIndex(indexes[1]);
            }
        }), 400);

        switch (view) {
            case "chu":
                this.doUpdateHistory({uri: "chu/" + obj.id + "/"});
                break;
            case "user":
                this.doUpdateHistory({uri: "user/" + obj.id + "/"});
                break;
            case "compose":
                this.doUpdateHistory({uri: "chu/new/"});
                break;
            case "share":
                this.doUpdateHistory({uri: "chu/share/" + obj.id + "/"});
                break;
            case "profile":
                this.doUpdateHistory({uri: "profile/"});
                if (!chuisy.getSignInStatus().signedIn) {
                    enyo.Signals.send("onRequestSignIn", {
                        failure: enyo.bind(this, this.back)
                    });
                } else {
                    chuisy.loadUserDetails();
                }
                break;
            default:
                this.doUpdateHistory({uri: view + "/"});
                break;
        }
    },
    components: [
        {kind: "Panels", name: "panels", arrangerKind: "CardArranger", animate: false, draggable: false, classes: "enyo-fill", components: [
            {kind: "FittableRows", components: [
                // MENU BAR
                {kind: "Menu", onChange: "menuChanged"},
                {fit: true, style: "position: relative;", components: [
                    // VIEWS THAT CAN BE REACHED VIA THE MENU BAR
                    {kind: "Panels", classes: "enyo-fill", arrangerKind: "CardArranger", animate: false, draggable: false, name: "primaryPanels", components: [
                        // CHU FEED
                        {kind: "Feed", name: "feed", onShowChu: "showChu", onComposeChu: "composeChu", onShowUser: "showUser"},
                        // CHU BOX / CLOSET
                        {kind: "ChuBox", name: "chubox", onShowChu: "showChu", onComposeChu: "composeChu"},
                        // OWN PROFILE VIEW
                        {kind: "ProfileView", name: "profile", onShowChu: "showChu", onShowUser: "showUser", onShowSettings: "showSettings"},
                        // DISCOVER VIEW
                        {kind: "Discover", name: "discover", onShowUser: "showUser", onShowChu: "showChu"},
                        // GIFTS
                        {kind: "Gifts", name: "gifts"},
                        // NOTIFICATIONS
                        {kind: "Notifications", name: "notifications", onNotificationSelected: "notificationSelected"}
                    ]},
                    {name: "primaryCrossover", classes: "fade-screen"}
                ]}
            ]},
            // CREATE NEW CHU
            {kind: "ComposeChu", name: "compose", onBack: "back", onDone: "composeChuDone"},
            // DISPLAY CHU
            {kind: "ChuView", name: "chu", onShare: "shareChu", onShowUser: "showUser", onBack: "back"},
            // SHARE CHU
            {kind: "ShareView", name: "share", onBack: "back", onDone: "back"},
            // SETTINGS
            {kind: "Settings", name: "settings", onBack: "back"},
            // PROFILE VIEW (for other profiles)
            {kind: "FittableRows", components: [
                {classes: "header", components: [
                    {kind: "onyx.Button", ontap: "back", classes: "back-button", content: "back"}
                ]},
                {kind: "ProfileView", name: "user", fit: true, onShowChu: "showChu", onShowUser: "showUser", onShowSettings: "showSettings"}
            ]}
        ]},
        {name: "crossover", classes: "fade-screen"}
    ]
});