/**
    _MainView_ contains the main menu bar as well as the feed, profile, goodies view and notifications
*/
enyo.kind({
    name: "MainView",
    classes: "mainview",
    kind: "FittableRows",
    menuChanged: function(sender, event) {
        // this.log("selecting " + event.value);
        this.$.panels.select(this.$[event.value]);
    },
    showFeed: function(chu) {
        this.$.panels.select(this.$.feed);
    },
    showProfile: function() {
        this.$.panels.select(this.$.profile);
    },
    showGoodies: function(chu) {
        this.$.panels.select(this.$.goodies);
    },
    showNotifications: function(chu) {
        this.$.panels.select(this.$.notifications);
    },
    components: [
        {kind: "Menu", onChange: "menuChanged"},
        {kind: "AnimatedPanels", fit: true, name: "panels", components: [
            // CHU FEED
            {kind: "Feed", name: "feed"},
            // OWN PROFILE VIEW
            {kind: "ProfileView", name: "profile"},
            // GOODIES
            {kind: "Goodies", name: "goodies"},
            // NOTIFICATIONS
            {kind: "Notifications", name: "notifications"}
        ]}
    ]
});