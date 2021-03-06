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
        this.$.panels.select(this.$.feed);
        if (!chuisy.feed.length) {
            this.$.feed.fetchFeed(true);
        }
    },
    showProfile: function() {
        this.$.menu.selectItem("profile");
        this.$.profile.activate();
        this.$.panels.select(this.$.profile);
    },
    showGoodies: function(chu) {
        this.$.menu.selectItem("goodies");
        this.$.goodies.activate();
        this.$.panels.select(this.$.goodies);
    },
    showNotifications: function(chu) {
        this.$.menu.selectItem("notifications");
        this.$.panels.select(this.$.notifications);
        setTimeout(function() {
            chuisy.notifications.seen();
        }, 100);
    },
    menuChanged: function(sender, event) {
        this.doMenuChanged(event);
    },
    activate: function() {
        this.$.panels.show();
        this.$.panels.resized();
    },
    deactivate: function() {
        this.$.panels.hide();
    },
    inAnimationStart: function(sender, event) {
        event.newPanel.resized();
    },
    components: [
        {classes: "mainview-inner enyo-fill", components: [
            {kind: "Menu", onChange: "menuChanged"},
            {kind: "AnimatedPanels", onInAnimationStart: "inAnimationStart", async: true, inAnim: "fadeIn", outAnim: "fadeOut", duration: 300, classes: "mainview-panels", name: "panels", components: [
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