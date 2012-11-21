enyo.kind({
    name: "MainView",
    classes: "mainview",
    narrowWidth: 800,
    views: {
        feed: 0,
        chubox: 1,
        chuView: 2,
        profileView: 3,
        settings: 4,
        composeChu: 5
    },
    isNarrow: function() {
        return this.getBounds().width < this.narrowWidth;
    },
    create: function() {
        this.inherited(arguments);
        this.$.primaryPanels.getAnimator().setDuration(1000);
    },
    userChanged: function(sender, event) {
        this.user = event.user;
        this.$.menuAvatar.applyStyle("background-image", "url(" + this.user.profile.avatar + ")");
        this.$.menuName.setContent(event.user.first_name + " " + event.user.last_name);
    },
    showView: function(name) {
        this.$.primaryPanels.setIndex(this.views[name]);
    },
    openFeed: function() {
        this.showView("feed");

        this.$.mainSlider.animateToMin();

        App.updateHistory("feed/");
    },
    openChubox: function(user) {
        this.showView("chubox");
        this.$.chubox.refreshChus();
        this.$.mainSlider.animateToMin();

        App.updateHistory("chubox/");
    },
    openChuView: function(chu) {
        this.$.chuView.setChu(chu);
        this.showView("chuView");

        this.$.mainSlider.animateToMin();

        App.updateHistory("chu/" + chu.id + "/");
    },
    openProfileView: function(user) {
        this.$.profileView.setUser(user);
        this.showView("profileView");

        this.$.mainSlider.animateToMin();

        App.updateHistory(user == "me" ? "me/": ("user/" + user.id + "/"));
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
    chuSelected: function(sender, event) {
        this.openChuView(event.chu);
    },
    back: function() {
        history.back();
    },
    toggleMenu: function() {
          this.$.mainSlider.toggleMinMax();
          event.preventDefault();
    },
    showProfile: function(sender, event) {
        this.openProfileView(event.user);
    },
    openSearch: function() {
        this.$.menuPanels.setIndex(1);
    },
    searchInputChange: function() {
        var query = this.$.searchInput.getValue();

        this.latestQuery = query;
        this.$.searchResults.setUsers("loading");
        chuisy.user.search(query, enyo.bind(this, function(sender, response) {
            if (response.meta.query == this.latestQuery) {
                this.$.searchResults.setUsers(response.objects);            }
        }));
        this.$.searchResults.setChus("loading");
        chuisy.chu.search(query, enyo.bind(this, function(sender, response) {
            if (response.meta.query == this.latestQuery) {
                this.$.searchResults.setChus(response.objects);
            }
        }));
        this.$.menuPanels.setIndex(1);
    },
    searchInputCancel: function() {
        this.$.menuPanels.setIndex(0);
        this.latestQuery = null;
    },
//     sliderAnimateFinish: function() {
// //        this.$.searchInput.setDisabled(!this.isSliderOpen());
//         if (!this.isSliderOpen()) {
//             this.$.searchInput.blur();
//         }
//     },
    isSliderOpen: function() {
        return this.$.mainSlider.getValue() == this.$.mainSlider.getMax();
    },
    components: [
        {classes: "mainmenu", components: [
            {kind: "Panels", name: "menuPanels", draggable: false, animate: false, classes: "enyo-fill", components: [
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
                    {classes: "mainmenu-item", ontap: "openSearch", name: "searchMenuItem", components: [
                        {classes: "mainmenu-item-icon search"},
                        {classes: "mainmenu-item-text", content: "Search"}
                    ]}
                ]},
                {kind: "FittableRows", components: [
                    {kind: "SearchInput", onChange: "searchInputChange", onCancel: "searchInputCancel", style: "width: 100%;", disabled: false},
                    {kind: "SearchResults", onUserSelected: "showProfile", onChuSelected: "chuSelected", fit: true}
                ]}
            ]}
        ]},
        {kind: "Slideable", name: "mainSlider", classes: "mainslider enyo-fill", unit: "px", min: 0, max: 270, overMoving: false, onAnimateFinish: "sliderAnimateFinish", components: [
            {kind: "Panels", arrangerKind: "CardArranger", animate: false, draggable: false, classes: "enyo-fill", name: "primaryPanels", components: [
                {kind: "Feed", onChuSelected: "chuSelected", onToggleMenu: "toggleMenu", onComposeChu: "composeChu", onShowProfile: "showProfile"},
                {kind: "Chubox", name: "chubox", onChuSelected: "chuSelected", onToggleMenu: "toggleMenu", onComposeChu: "composeChu"},
                {kind: "ChuView", name: "chuView", onBack: "back"},
                {kind: "ProfileView", onChuSelected: "chuSelected", onToggleMenu: "toggleMenu", onShowProfile: "showProfile", onBack: "back"},
                {kind: "Settings", onToggleMenu: "toggleMenu"},
                {kind: "ComposeChu", onBack: "back"}
            ]}
        ]},
        {kind: "enyo.Signals", onUserChanged: "userChanged"}
    ]
});