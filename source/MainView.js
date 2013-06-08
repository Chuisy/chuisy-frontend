/**
    _MainView_ contains all views that contain all the relevant content
*/
enyo.kind({
    name: "MainView",
    classes: "mainview",
    kind: "FittableRows",
    events: {
        // User wants to go to the previous view
        onBack: "",
        // User has selected an item from the main menu
        onMenuChanged: "",
        onChuViewDone: "",
        onComposeChuDone: "",
        onGetStartedDone: "",
        onGuideDone: ""
    },
    // Mapping between view and panel indexes
    views: {
        feed: [0, 0],
        closet: [0, 1],
        profile: [0, 2],
        discover: [0, 3],
        goodies: [0, 4],
        notifications: [0, 5],
        compose: [1, null],
        chu: [2, null],
        settings: [3, null],
        user: [4, null],
        store: [5, null],
        discoverChus: [6, null],
        discoverUsers: [7, null],
        discoverStores: [8, null],
        invite: [9, null],
        getstarted: [10, null],
        guide: [11, null]
    },
    create: function() {
        this.inherited(arguments);
        this.updateProfile();
        chuisy.accounts.on("change:active_user", this.updateProfile, this);
    },
    updateProfile: function() {
        var user = chuisy.accounts.getActiveUser();
        if (user) {
            this.$.profile.setUser(user);
        }
    },
    menuChanged: function(sender, event) {
        this.doMenuChanged(event);
    },
    chuViewDone: function(sender, event) {
        this.$.chu.setButtonLabel($L("back"));
        this.doChuViewDone(event);
    },
    composeChuDone: function(sender, event) {
        // this.$.chu.setButtonLabel($L("done"));
        // this.$.chu.isNew = true;
        this.doComposeChuDone(event);
    },
    getStartedDone: function() {
        this.doGetStartedDone();
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
    openView: function(view, obj, direct) {
        if (!direct) {
            this.transition(this.currentView, view);
        }
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
        }), direct ? 0 : 400);
        this.$.menu.selectItem(view);
    },
    guideDone: function() {
        this.doGuideDone();
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
                        {kind: "Feed", name: "feed"},
                        // CHU BOX / CLOSET
                        {kind: "Closet", name: "closet"},
                        // OWN PROFILE VIEW
                        {kind: "ProfileView", name: "profile"},
                        // DISCOVER VIEW
                        {kind: "Discover", name: "discover"},
                        // GOODIES
                        {kind: "Goodies", name: "goodies"},
                        // NOTIFICATIONS
                        {kind: "Notifications", name: "notifications"}
                    ]},
                    {name: "primaryCrossover", classes: "fade-screen"}
                ]}
            ]},
            // CREATE NEW CHU
            {kind: "ComposeChu", name: "compose", onDone: "composeChuDone"},
            // DISPLAY CHU
            {kind: "ChuView", name: "chu", onDone: "chuViewDone"},
            // SETTINGS
            {kind: "Settings", name: "settings"},
            // PROFILE VIEW (for other profiles)
            {kind: "FittableRows", components: [
                {classes: "header", components: [
                    {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")}
                ]},
                {kind: "ProfileView", name: "user", fit: true}
            ]},
            // LOCATION VIEW
            {kind: "StoreView", name: "store"},
            // DISCOVER CHUS
            {kind: "DiscoverChus", name: "discoverChus"},
            {kind: "DiscoverUsers", name: "discoverUsers"},
            {kind: "DiscoverStores", name: "discoverStores"},
            {kind: "InviteFriends", name: "invite"},
            {kind: "GetStarted", name: "getstarted", onDone: "getStartedDone"},
            {kind: "Guide", name: "guide", onDone: "guideDone"}
        ]},
        {name: "crossover", classes: "fade-screen"}
    ]
});