enyo.kind({
    name: "GetStarted",
    classes: "getstarted",
    events: {
        onDone: ""
    },
    create: function() {
        this.inherited(arguments);
        this.suggestedUsers = new chuisy.models.UserCollection([], {
            url: chuisy.models.UserCollection.prototype.url + "suggested/"
        });
        this.$.suggestedUsersList.setUsers(this.suggestedUsers);
    },
    shown: function() {
        setTimeout(enyo.bind(this, function() {
            this.addClass("shown");
        }), 1000);
    },
    signIn: function() {
        if (App.checkConnection()) {
            App.loginWithFacebook(enyo.bind(this, function(accessToken) {
                this.$.spinner.show();
                chuisy.signIn(accessToken, enyo.bind(this, function(user) {
                    this.$.spinner.hide();
                    this.signInContinue(user);
                }), enyo.bind(this, function() {
                    this.$.spinner.hide();
                    navigator.notification.alert($L("Hm, that didn't work. Please try it again later!"), enyo.bind(this, function() {
                        this.doDone();
                    }, $L("Authentication failed"), $L("OK")));
                }));
            }));
        } else {
            this.doDone();
        }
    },
    signInContinue: function(user) {
        user.fbFriends.fetchAll();
        this.$.panels.setIndex(1);
        enyo.asyncMethod(this, function() {
            this.$.suggestedUsersPanel.reflow();
        });
        this.$.suggestedUsersSpinner.show();
        this.suggestedUsers.fetch({success: enyo.bind(this, function() {
            this.log("suggested users fetched! " + this.suggestedUsers.length);
            this.$.suggestedUsersSpinner.hide();
            this.$.suggestedUsersPanel.reflow();
            if (!this.suggestedUsers.length) {
                this.suggestedUsersContinue();
            }
        }), error: enyo.bind(this, function() {
            this.suggestedUsersContinue();
        })});
    },
    suggestedUsersContinue: function() {
        this.$.panels.setIndex(2);
        enyo.asyncMethod(this, function() {
            this.$.inviteFriendsPanel.reflow();
        });
    },
    inviteFriendsContinue: function() {
        var selectedFriends = this.$.fbFriendsPicker.getIds();
        if (selectedFriends.length) {
            FB.ui({
                method: "apprequests",
                message: $L("Come join me on Chuisy, share beautiful fashion with me and help me decide on shopping decisions!"),
                to: selectedFriends
            }, enyo.bind(this, function(response) {
                if (response.request) {
                    // User did send the request
                    this.doDone();
                }
            }));
        } else {
            this.doDone();
        }
    },
    components: [
        {kind: "Panels", arrangerKind: "CarouselArranger", draggable: false, classes: "enyo-fill", components: [
            {classes: "getstarted-login enyo-fill", components: [
                {classes: "getstarted-login-logo"},
                {classes: "getstarted-login-buttons", components: [
                    {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
                        {classes: "facebook-button-icon"},
                        {content: $L("Sign In With Facebook")}
                    ]},
                    {kind: "onyx.Button", content: $L("Skip"), ontap: "doDone"},
                    {kind: "onyx.Spinner", classes: "getstarted-login-spinner", showing: false}
                ]}
            ]},
            {kind: "FittableRows", name: "suggestedUsersPanel", classes: "enyo-fill", components: [
                {classes: "getstarted-suggestedusers-text", content: $L("Here are some people you might be interested in. Follow them to see their discoveries!")},
                {kind: "onyx.Spinner", classes: "getstarted-suggestedusers-spinner", name: "suggestedUsersSpinner"},
                {kind: "UserList", name: "suggestedUsersList", fit: true},
                {classes: "getstarted-continue", components: [
                    {kind: "onyx.Button", classes: "getstarted-continue-button", content: $L("Continue"), ontap: "suggestedUsersContinue"}
                ]}
            ]},
            {kind: "FittableRows", name: "inviteFriendsPanel", classes: "enyo-fill", components: [
                {classes: "getstarted-invitefriends-text", content: $L("Chuisy is much more fun to use with other people. Invite your friends to Chuisy now!")},
                {kind: "FbFriendsPicker", fit: true, buttonLabel: $L("invite")},
                {classes: "getstarted-continue", components: [
                    {kind: "onyx.Button", classes: "getstarted-continue-button", content: $L("Continue"), ontap: "inviteFriendsContinue"}
                ]}
            ]}
        ]}
    ]
});