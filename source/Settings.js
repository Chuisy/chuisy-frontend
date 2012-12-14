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
            this.$.firstName.setValue(this.user.first_name);
            this.$.lastName.setValue(this.user.last_name);
            this.$.website.setValue(this.user.profile.website);
            // this.$.bio.setValue(this.user.profile.bio);
            this.$.avatar.applyStyle("background-image", "url(" + this.user.profile.avatar + ")");
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
        params.image = params.image.replace(/http:\/\/media.chuisy.com\/media\//, "");
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
                        {content: "Likes", classes: "settings-notifications-text"}
                    ]},
                    {classes: "settings-notifications-item", components: [
                        {content: "Comments", classes: "settings-notifications-text"}
                    ]},
                    {classes: "settings-notifications-item", components: [
                        {content: "Follows", classes: "settings-notifications-text"}
                    ]}
                ]}
            ]}
        ]},
        {kind: "Signals", onNotificationsUpdated: "notificationsUpdated", onUserChanged: "userChanged", onSignInSuccess: "updateFacebookConnectItem", onSignOut: "updateFacebookConnectItem"}
    ]
});