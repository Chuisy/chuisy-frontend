/**
    _Settings_ is a view for changing the users account settings
*/
enyo.kind({
    name: "Settings",
    kind: "FittableRows",
    classes: "settings",
    events: {
        // User has tapped the back button
        onBack: "",
        onInviteFriends: ""
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        this.userChanged();
        this.listenTo(chuisy.accounts, "change:active_user", this.userChanged);
    },
    userChanged: function(sender, event) {
        var user = chuisy.accounts.getActiveUser();

        if (user) {
            this.updateView();
            this.stopListening();
            this.listenTo(user, "change change:avatar", this.updateView);
        } else {
            this.doBack();
        }
    },
    updateView: function() {
        var user = chuisy.accounts.getActiveUser();
        this.$.firstName.setValue(user.get("first_name"));
        this.$.lastName.setValue(user.get("last_name"));
        this.$.website.setValue(user.profile.get("website"));
        var avatar = user.get("localAvatar") || user.profile.get("avatar");
        this.$.avatar.applyStyle("background-image", "url(" + avatar + ")");
        this.$.ogActionsButton.setValue(user.profile.get("fb_og_share_actions"));
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
        user.profile.set("fb_og_share_actions", this.$.ogActionsButton.getValue());
        user.save({
            first_name: this.$.firstName.getValue(),
            last_name: this.$.lastName.getValue()
        });
        // chuisy.accounts.mark(user, "changed", true);
        chuisy.accounts.syncActiveUser();
    },
    facebookSignIn: function() {
        // Get facebook access token
        enyo.Signals.send("onRequestSignIn", {});
    },
    /**
        Sign out. Simply calls _chuisy.signOut_
    */
    signOut: function() {
        if (navigator.notification) {
            navigator.notification.confirm($L("Are you sure you want to log out?"), enyo.bind(this, function(choice) {
                if (choice == 2) {
                    chuisy.signOut();
                    this.doBack();
                }
            }), $L("Logout"), [$L("Cancel"), $L("Logout")].join(","));
        } else {
            chuisy.signOut();
            this.doBack();
        }
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
        chuisy.accounts.getActiveUser().changeAvatar(uri);
    },
    toggleNotification: function(sender, event) {
        var prop = sender.prop;
        var user = chuisy.accounts.getActiveUser();
        user.profile.set(prop, !user.profile.get(prop));
        this.updateUser();
    },
    toggleOgActions: function() {
        if (this.$.ogActionsButton.getValue()) {
            App.fbRequestPublishPermissions();
        }
        this.updateUser();
    },
    activate: function() {},
    deactivate: function() {},
    components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: $L("back")}
        ]},
        {kind: "Scroller", fit: true, strategyKind: "TransitionScrollStrategy", thumb: false, components: [
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
                {classes: "settings-section-header", content: $L("Facebook")},
                {kind: "onyx.Groupbox", components: [
                    // FACEBOOK
                    {classes: "settings-item", components: [
                        {content: $L("Post actions"), classes: "settings-item-text"},
                        {kind: "onyx.ToggleButton", name: "ogActionsButton", onChange: "toggleOgActions"}
                    ]}
                ]},
                {kind: "onyx.Button", style: "width: 100%", content: $L("Invite Friends"), ontap: "doInviteFriends"},
                // NOTIFICATION SETTINGS
                {classes: "settings-section-header", content: $L("Notifications")},
                {kind: "onyx.Groupbox", components: [
                    // LIKES
                    {classes: "settings-item", components: [
                        {content: $L("Likes"), classes: "settings-item-text"},
                        {classes: "settings-notification-icon push", name: "pushLikeIcon", prop: "push_like", ontap: "toggleNotification"},
                        {classes: "settings-notification-icon email", name: "emailLikeIcon", prop: "email_like", ontap: "toggleNotification"}
                    ]},
                    // COMMENTS
                    {classes: "settings-item", components: [
                        {content: $L("Comments"), classes: "settings-item-text"},
                        {classes: "settings-notification-icon push", name: "pushCommentIcon", prop: "push_comment", ontap: "toggleNotification"},
                        {classes: "settings-notification-icon email", name: "emailCommentIcon", prop: "email_comment", ontap: "toggleNotification"}
                    ]},
                    // FOLLOWS
                    {classes: "settings-item", components: [
                        {content: $L("Follows"), classes: "settings-item-text"},
                        {classes: "settings-notification-icon push", name: "pushFollowIcon", prop: "push_follow", ontap: "toggleNotification"},
                        {classes: "settings-notification-icon email", name: "emailFollowIcon", prop: "email_follow", ontap: "toggleNotification"}
                    ]}
                ]},
                {kind: "onyx.Button", style: "width: 100%; margin-top: 20px;", content: $L("Logout"), ontap: "signOut"}
            ]}
        ]}
    ]
});