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
    userChanged: function(sender, event) {
        this.user = event.user;

        if (this.user) {
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
    /**
        Sends changes to user object to the API
    */
    updateUser: function() {
        var params = enyo.clone(this.user);
        // Switch the profile object for its resource_uri to avoid problems with the api
        params.profile = params.profile.resource_uri;
        chuisy.user.put(params.id, params, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
    },
    updateProfile: function() {
        var params = enyo.clone(this.user.profile);
        chuisy.profile.put(params.id, params, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
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
        this.user.profile[prop] = !this.user.profile[prop];
        sender.addRemoveClass("active", this.user.profile[prop]);
        this.updateProfile();
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
                        {kind: "onyx.Input", name: "firstName", placeholder: $L("First Name"), onchange: "firstNameChanged"}
                    ]},
                    // LAST NAME
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "lastName", placeholder: $L("Last Name"), onchange: "lastNameChanged"}
                    ]},
                    // WEBSITE
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "website", placeholder: $L("Website"), onchange: "websiteChanged"}
                    ]}
                    // {kind: "onyx.InputDecorator", components: [
                    //     {kind: "onyx.TextArea", name: "bio", placeholder: "Bio", onchange: "bioChanged"}
                    // ]}
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