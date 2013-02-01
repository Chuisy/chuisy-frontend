/**
    _Settings_ is a view for changing the users account settings
*/
enyo.kind({
    name: "Settings",
    kind: "FittableRows",
    classes: "settings",
    events: {
        // User has tapped the back button
        onBack: ""
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        this.userChanged();
        this.listenTo(chuisy.accounts, "sync change:active_user", this.userChanged);
    },
    userChanged: function(sender, event) {
        this.stopListening();
        var user = chuisy.accounts.getActiveUser();

        if (user) {
            this.updateView();
            this.listenTo(user, "change", this.updateView);
        }
    },
    updateView: function() {
        var user = chuisy.accounts.getActiveUser();
        this.$.firstName.setValue(user.get("first_name"));
        this.$.lastName.setValue(user.get("last_name"));
        this.$.website.setValue(user.profile.get("website"));
        this.$.avatar.applyStyle("background-image", "url(" + user.profile.get("avatar") + ")");
        this.$.pushLikeIcon.addRemoveClass("active", user.profile.get("push_like"));
        this.$.emailLikeIcon.addRemoveClass("active", user.profile.get("email_like"));
        this.$.pushCommentIcon.addRemoveClass("active", user.profile.get("push_comment"));
        this.$.emailCommentIcon.addRemoveClass("active", user.profile.get("email_comment"));
        this.$.pushFollowIcon.addRemoveClass("active", user.profile.get("push_follow"));
        this.$.emailFollowIcon.addRemoveClass("active", user.profile.get("email_follow"));
    },
    updateUser: function() {
        var user = chuisy.accounts.getActiveUser();
        user.profile.set("website", this.$.website.getValue());
        user.save({
            first_name: this.$.firstName.getValue(),
            last_name: this.$.lastName.getValue()
        }, {remote: true});
    },
    facebookSignIn: function() {
        // Get facebook access token
        enyo.Signals.send("onRequestSignIn", {});
    },
    /**
        Sign out. Simply calls _chuisy.signOut_
    */
    signOut: function() {
        chuisy.signOut();
    },
    updateFacebookConnectItem: function() {
        this.$.facebookConnectItem.addRemoveClass("connected", chuisy.getSignInStatus().signedIn);
    },
    /**
        Open photo library to change profile picture
    */
    changeAvatar: function() {
        try {
            navigator.camera.cleanup();
            navigator.camera.getPicture(enyo.bind(this, this.gotImage), enyo.bind(this, function() {
                this.warn("Getting image failed!");
            }), {sourceType: Camera.PictureSourceType.PHOTOLIBRARY, targetWidth: 300, targetHeight: 300, allowEdit: true, correctOrientation: true, quality: 49});
        } catch (e) {
            this.warn("No camera available!");
        }
    },
    gotImage: function(uri) {
        this.$.avatar.applyStyle("background-image", "url(" + uri + ")");
        chuisy.uploadAvatar(uri);
    },
    toggleNotification: function(sender, event) {
        var prop = sender.prop;
        var user = chuisy.accounts.getActiveUser();
        user.profile.set(prop, !user.profile.get(prop));
        this.updateUser();
    },
    activate: function() {},
    deactivate: function() {},
    components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: $L("back")}
        ]},
        {kind: "Scroller", fit: true, components: [
            {classes: "settings-content", components: [
                // PROFILE INFORMATION
                {classes: "settings-section-header", content: $L("Profile")},
                {kind: "onyx.Groupbox", components: [
                    // AVATAR
                    {name: "avatar", classes: "settings-avatar", components: [
                        {kind: "onyx.Button", classes: "settings-change-avatar", content: $L("Change"), ontap: "changeAvatar"}
                    ]},
                    // FIRST NAME
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "firstName", placeholder: $L("First Name"), onchange: "updateUser"}
                    ]},
                    // LAST NAME
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "lastName", placeholder: $L("Last Name"), onchange: "updateUser"}
                    ]},
                    // WEBSITE
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "website", placeholder: $L("Website"), onchange: "updateUser"}
                    ]}
                ]},
                // LINKED ACCOUNTS
                {classes: "settings-section-header", content: $L("Accounts")},
                {kind: "onyx.Groupbox", components: [
                    // FACEBOOK
                    {classes: "settings-connect-item facebook", name: "facebookConnectItem", components: [
                        {classes: "settings-connect-icon"},
                        {content: $L("Facebook"), classes: "settings-connect-text"},
                        {kind: "onyx.Button", classes: "settings-connect-button", content: $L("Connect"), ontap: "facebookSignIn"},
                        {kind: "onyx.Button", classes: "settings-connect-disconnect", content: $L("Disconnect"), ontap: "signOut"}
                    ]}
                ]},
                // NOTIFICATION SETTINGS
                {classes: "settings-section-header", content: $L("Notifications")},
                {kind: "onyx.Groupbox", components: [
                    // LIKES
                    {classes: "settings-notifications-item", components: [
                        {content: $L("Likes"), classes: "settings-notifications-text"},
                        {classes: "settings-notification-icon push", name: "pushLikeIcon", prop: "push_like", ontap: "toggleNotification"},
                        {classes: "settings-notification-icon email", name: "emailLikeIcon", prop: "email_like", ontap: "toggleNotification"}
                    ]},
                    // COMMENTS
                    {classes: "settings-notifications-item", components: [
                        {content: $L("Comments"), classes: "settings-notifications-text"},
                        {classes: "settings-notification-icon push", name: "pushCommentIcon", prop: "push_comment", ontap: "toggleNotification"},
                        {classes: "settings-notification-icon email", name: "emailCommentIcon", prop: "email_comment", ontap: "toggleNotification"}
                    ]},
                    // FOLLOWS
                    {classes: "settings-notifications-item", components: [
                        {content: $L("Follows"), classes: "settings-notifications-text"},
                        {classes: "settings-notification-icon push", name: "pushFollowIcon", prop: "push_follow", ontap: "toggleNotification"},
                        {classes: "settings-notification-icon email", name: "emailFollowIcon", prop: "email_follow", ontap: "toggleNotification"}
                    ]}
                ]}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged", onSignInSuccess: "updateFacebookConnectItem", onSignOut: "updateFacebookConnectItem"}
    ]
});