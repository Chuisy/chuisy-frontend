enyo.kind({
    name: "Settings",
    kind: "FittableRows",
    classes: "settings",
    published: {
        user: null
    },
    events: {
        onToggleMenu: "",
        onShowNotifications: ""
    },
    userChanged: function(sender, event) {
        this.user = event.user;
        this.$.firstName.setValue(this.user.first_name);
        this.$.lastName.setValue(this.user.last_name);
        this.$.website.setValue(this.user.profile.website);
        this.$.bio.setValue(this.user.profile.bio);
    },
    firstNameChanged: function() {
        this.user.first_name = this.$.firstName.getValue();
        this.updateUser();
    },
    lastNameChanged: function() {
        this.user.last_name = this.$.lastName.getValue();
        this.updateUser();
    },
    websiteChanged: function() {
        this.user.profile.website = this.$.website.getValue();
        this.updateUser();
    },
    bioChanged: function() {
        this.user.profile.bio = this.$.bio.getValue();
        this.updateUser();
    },
    updateUser: function() {
        chuisy.user.put(this.user.id, this.user, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
    },
    facebookSignIn: function() {
        // Get facebook access token
        enyo.Signals.send("onRequestSignIn", {});
    },
    signOut: function() {
        chuisy.signOut();
    },
    notificationsUpdated: function(sender, event) {
        this.$.notificationBadge.setContent(event.unread_count);
        this.$.notificationBadge.setShowing(event.unread_count);
        return true;
    },
    updateFacebookConnectItem: function() {
        this.$.facebookConnectItem.addRemoveClass("connected", chuisy.getSignInStatus().signedIn);
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {classes: "menu-button-icon"}
            ]},
            {classes: "mainheader-text", content: "Settings"},
            {kind: "onyx.Button", classes: "notification-button", ontap: "doShowNotifications", components: [
                {classes: "notification-button-icon"},
                {classes: "notification-button-badge", name: "notificationBadge", content: "0", showing: false}
            ]}
        ]},
        {kind: "Scroller", fit: true, horizontal: "hidden", components: [
            {classes: "settings-content", components: [
                {classes: "settings-section-header", content: "Profile"},
                {kind: "onyx.Groupbox", components: [
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "firstName", placeholder: "First Name", onchange: "firstNameChanged"}
                    ]},
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "lastName", placeholder: "Last Name", onchange: "lastNameChanged"}
                    ]},
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "website", placeholder: "Website", onchange: "websiteChanged"}
                    ]},
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.TextArea", name: "bio", placeholder: "Bio", onchange: "bioChanged"}
                    ]}
                ]},
                {classes: "settings-section-header", content: "Accounts"},
                {kind: "onyx.Groupbox", components: [
                    {classes: "settings-connect-item", name: "facebookConnectItem", components: [
                        {content: "Facebook", classes: "settings-connect-text"},
                        {kind: "onyx.Button", classes: "settings-connect-button", content: "Connect", ontap: "facebookSignIn"},
                        {kind: "onyx.Button", classes: "settings-connect-disconnect", content: "Disconnect", ontap: "signOut"}
                    ]}
                ]},
                {classes: "settings-section-header", content: "Notifications"},
                {kind: "onyx.Groupbox", components: [
                    {classes: "settings-notifications-item", name: "facebookConnectItem", components: [
                        {content: "Likes", classes: "settings-notifications-text"}
                    ]},
                    {classes: "settings-notifications-item", name: "facebookConnectItem", components: [
                        {content: "Comments", classes: "settings-notifications-text"}
                    ]},
                    {classes: "settings-notifications-item", name: "facebookConnectItem", components: [
                        {content: "Follows", classes: "settings-notifications-text"}
                    ]}
                ]}
            ]}
        ]},
        {kind: "Signals", onNotificationsUpdated: "notificationsUpdated", onUserChanged: "userChanged", onSignInSuccess: "updateFacebookConnectItem", onSignOut: "updateFacebookConnectItem"}
    ]
});