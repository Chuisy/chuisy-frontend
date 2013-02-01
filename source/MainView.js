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
        closet: [0, 1],
        profile: [0, 2],
        discover: [0, 3],
        gifts: [0, 4],
        notifications: [0, 5],
        compose: [1, null],
        chu: [2, null],
        // share: [3, null],
        settings: [3, null],
        user: [4, null],
        gift: [5, null]
    },
    create: function() {
        this.inherited(arguments);
        this.updateProfile();
        chuisy.accounts.on("sync change:active_user", this.updateProfile, this);
    },
    updateProfile: function() {
        var user = chuisy.accounts.getActiveUser();
        if (user) {
            this.$.profile.setUser(user);
        }
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
    // shareChu: function(sender, event) {
    //     this.openView("share", event.chu);
    // },
    showUser: function(sender, event) {
        this.openView("user", event.user);
    },
    showSettings: function() {
        this.openView("settings");
    },
    showGift: function(sender, event) {
        this.openView("gift", event.gift);
    },
    notificationSelected: function(sender, event) {
        this.doNavigateTo({uri: event.notification.get("uri")});
    },
    // shareViewDone: function(sender, event) {
    //     this.openView("chu", sender.getChu());
    // },
    composeChuDone: function(sender, event) {
        // this.openView("feed");
        // this.$.feed.loadFeed();
        this.doUpdateHistory({uri: "feed/"});
        this.openView("chu", event.chu);
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
            case "gift":
                this.doUpdateHistory({uri: "gift/" + obj.id + "/"});
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
                enyo.Signals.send("onShowGuide", {view: "profile"});
                var user = chuisy.accounts.getActiveUser();
                if (user) {
                    user.fetch({remote: true});
                }
                break;
            default:
                this.doUpdateHistory({uri: view + "/"});
                this.$.menu.selectItem(view);
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
                        {kind: "Closet", name: "closet", onShowChu: "showChu", onComposeChu: "composeChu"},
                        // OWN PROFILE VIEW
                        {kind: "ProfileView", name: "profile", onShowChu: "showChu", onShowUser: "showUser", onShowSettings: "showSettings"},
                        // DISCOVER VIEW
                        {kind: "Discover", name: "discover", onShowUser: "showUser", onShowChu: "showChu"},
                        // GIFTS
                        {kind: "Gifts", name: "gifts", onShowGift: "showGift"},
                        // NOTIFICATIONS
                        {kind: "Notifications", name: "notifications", onNotificationSelected: "notificationSelected"}
                    ]},
                    {name: "primaryCrossover", classes: "fade-screen"}
                ]}
            ]},
            // CREATE NEW CHU
            {kind: "ComposeChu", name: "compose", onBack: "back", onDone: "composeChuDone"},
            // DISPLAY CHU
            {kind: "ChuView", name: "chu", onShowUser: "showUser", onBack: "back"},
            // // SHARE CHU
            // {kind: "ShareView", name: "share", onBack: "back", onDone: "back"},
            // SETTINGS
            {kind: "Settings", name: "settings", onBack: "back"},
            // PROFILE VIEW (for other profiles)
            {kind: "FittableRows", components: [
                {classes: "header", components: [
                    {kind: "onyx.Button", ontap: "back", classes: "back-button", content: $L("back")}
                ]},
                {kind: "ProfileView", name: "user", fit: true, onShowChu: "showChu", onShowUser: "showUser", onShowSettings: "showSettings"}
            ]},
            // DISPLAY GIFT
            {kind: "GiftView", onBack: "back", name: "gift"}
        ]},
        {name: "crossover", classes: "fade-screen"}
    ]
});