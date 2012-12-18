enyo.kind({
    name: "Settings",
    kind: "FittableRows",
    classes: "settings",
    published: {
        user: null
    },
    events: {
        onBack: ""
    },
    userChanged: function(sender, event) {
        this.user = event.user;

        if (this.user) {
            this.log(this.user);
            this.$.firstName.setValue(this.user.first_name);
            this.$.lastName.setValue(this.user.last_name);
            this.$.website.setValue(this.user.profile.website);
            // this.$.bio.setValue(this.user.profile.bio);
            this.$.avatar.applyStyle("background-image", "url(" + this.user.profile.avatar + ")");
            this.$.pushLikeIcon.addRemoveClass("active", this.user.profile.push_like);
            this.$.emailLikeIcon.addRemoveClass("active", this.user.profile.email_like);
            this.$.pushCommentIcon.addRemoveClass("active", this.user.profile.push_comment);
            this.$.emailCommentIcon.addRemoveClass("active", this.user.profile.email_comment);
            this.$.pushFollowIcon.addRemoveClass("active", this.user.profile.push_follow);
            this.$.emailFollowIcon.addRemoveClass("active", this.user.profile.email_follow);
        }
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
        this.updateProfile();
    },
    // bioChanged: function() {
    //     this.user.profile.bio = this.$.bio.getValue();
    //     this.updateProfile();
    // },
    updateUser: function() {
        var params = enyo.clone(this.user);
        params.profile = params.profile.resource_uri;
        chuisy.user.put(params.id, params, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
    },
    updateProfile: function() {
        var params = enyo.clone(this.user.profile);
        params.avatar = params.avatar.replace(/http:\/\/media.chuisy.com\/media\//, "");
        chuisy.profile.put(params.id, params, enyo.bind(this, function(sender, response) {
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
        this.$.notificationBadge.setContent(event.unseen_count);
        this.$.notificationBadge.setShowing(event.unseen_count);
        return true;
    },
    updateFacebookConnectItem: function() {
        this.$.facebookConnectItem.addRemoveClass("connected", chuisy.getSignInStatus().signedIn);
    },
    changeAvatar: function() {
        try {
            navigator.camera.cleanup();
            navigator.camera.getPicture(enyo.bind(this, this.gotImage), enyo.bind(this, function() {
                this.warn("Getting image failed!");
            }), {targetWidth: 500, sourceType: Camera.PictureSourceType.PHOTOLIBRARY, correctOrientation: true});
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
        this.user.profile[prop] = !this.user.profile[prop];
        sender.addRemoveClass("active", this.user.profile[prop]);
        this.updateProfile();
    },
    components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"}
        ]},
        {kind: "Scroller", fit: true, components: [
            {classes: "settings-content", components: [
                {classes: "settings-section-header", content: "Profile"},
                {kind: "onyx.Groupbox", components: [
                    {name: "avatar", classes: "settings-avatar", components: [
                        {kind: "onyx.Button", classes: "settings-change-avatar", content: "change", ontap: "changeAvatar"}
                    ]},
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "firstName", placeholder: "First Name", onchange: "firstNameChanged"}
                    ]},
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "lastName", placeholder: "Last Name", onchange: "lastNameChanged"}
                    ]},
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "website", placeholder: "Website", onchange: "websiteChanged"}
                    ]}
                    // {kind: "onyx.InputDecorator", components: [
                    //     {kind: "onyx.TextArea", name: "bio", placeholder: "Bio", onchange: "bioChanged"}
                    // ]}
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
                    {classes: "settings-notifications-item", components: [
                        {content: "Likes", classes: "settings-notifications-text"},
                        {classes: "settings-notification-icon push", name: "pushLikeIcon", prop: "push_like", ontap: "toggleNotification"},
                        {classes: "settings-notification-icon email", name: "emailLikeIcon", prop: "email_like", ontap: "toggleNotification"}                   ]},
                    {classes: "settings-notifications-item", components: [
                        {content: "Comments", classes: "settings-notifications-text"},
                        {classes: "settings-notification-icon push", name: "pushCommentIcon", prop: "push_comment", ontap: "toggleNotification"},
                        {classes: "settings-notification-icon email", name: "emailCommentIcon", prop: "email_comment", ontap: "toggleNotification"}
                    ]},
                    {classes: "settings-notifications-item", components: [
                        {content: "Follows", classes: "settings-notifications-text"},
                        {classes: "settings-notification-icon push", name: "pushFollowIcon", prop: "push_follow", ontap: "toggleNotification"},
                        {classes: "settings-notification-icon email", name: "emailFollowIcon", prop: "email_follow", ontap: "toggleNotification"}
                    ]}
                ]}
            ]}
        ]},
        {kind: "Signals", onNotificationsUpdated: "notificationsUpdated", onUserChanged: "userChanged", onSignInSuccess: "updateFacebookConnectItem", onSignOut: "updateFacebookConnectItem"}
    ]
});