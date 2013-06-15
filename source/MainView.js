/**
    _MainView_ contains the main menu bar as well as the feed, profile, goodies view and notifications
*/
enyo.kind({
    name: "MainView",
    classes: "mainview",
    events: {
        onMenuChanged: ""
    },
    showFeed: function(chu) {
        this.$.menu.selectItem("feed");
        this.$.feed.addChu(chu);
        this.$.panels.selectDirect(this.$.feed);
        this.$.feed.resized();
    },
    showProfile: function() {
        this.$.menu.selectItem("profile");
        this.$.panels.selectDirect(this.$.profile);
    },
    showGoodies: function(chu) {
        this.$.menu.selectItem("goodies");
        this.$.goodies.activate();
        this.$.panels.selectDirect(this.$.goodies);
    },
    showNotifications: function(chu) {
        this.$.menu.selectItem("notifications");
        this.$.notifications.seen();
        this.$.panels.selectDirect(this.$.notifications);
        this.$.notifications.resized();
    },
    menuChanged: function(sender, event) {
        this.doMenuChanged(event);
    },
    components: [
        {classes: "mainview-inner enyo-fill", components: [
            {kind: "Menu", onChange: "menuChanged"},
            {kind: "AnimatedPanels", classes: "mainview-panels", name: "panels", components: [
                // CHU FEED
                {kind: "Feed", name: "feed"},
                // OWN PROFILE VIEW
                {kind: "ProfileView", name: "profile"},
                // GOODIES
                {kind: "Goodies", name: "goodies"},
                // NOTIFICATIONS
                {kind: "Notifications", name: "notifications"}
            ]}
        ]}
    ]
});