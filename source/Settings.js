enyo.kind({
    name: "Settings",
    kind: "FittableRows",
    classes: "Settings",
    published: {
        user: null
    },
    events: {
        onToggleMenu: ""
    },
    userChanged: function() {
        if (this.user) {
            this.$.firstName.setValue(this.user.first_name);
            this.$.lastName.setValue(this.user.last_name);
            this.$.website.setValue(this.user.profile.website);
            this.$.bio.setValue(this.user.profile.bio);
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
        FB.login(enyo.bind(this, function(response) {
            if (response.status == "connected") {
                chuisy.signIn({fb_access_token: response.authResponse.accessToken});
            } else {
                alert("Facebook signin failed!");
            }
        }), {scope: "user_birthday,user_location,user_about_me,user_website,email"});
    },
    signOut: function() {
        chuisy.signOut();
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {classes: "mainheader-text", content: "Settings"}
        ]},
        {classes: "main-content", fit: true, components: [
            {kind: "onyx.Groupbox", components: [
                {kind: "onyx.GroupboxHeader", content: "Account Settings"},
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
            {kind: "onyx.Button", content: "Sign in with Facebook", ontap: "facebookSignIn"},
            {kind: "onyx.Button", content: "Logout", ontap: "signOut"}
        ]}
    ]
});