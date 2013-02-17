enyo.kind({
    name: "GetStarted",
    classes: "getstarted",
    events: {
        onDone: ""
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
                    user.fbFriends.fetchAll();
                    this.$.panels.setIndex(1);
                    enyo.asyncMethod(this, function() {
                        this.$.inviteFriendsPanel.reflow();
                    });
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
        {kind: "Panels", arrangerKind: "CarouselArranger", classes: "enyo-fill", components: [
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
            {kind: "FittableRows", name: "inviteFriendsPanel", classes: "enyo-fill", components: [
                {classes: "getstarted-invitefriends-text", content: $L("Chuisy is much more fun to use with other people. Invite your friends to Chuisy now!")},
                {kind: "FbFriendsPicker", fit: true, buttonLabel: $L("invite")},
                {classes: "getstarted-invitefriends-continue", components: [
                    {kind: "onyx.Button", classes: "getstarted-invitefriends-continue-button", content: $L("Continue"), ontap: "inviteFriendsContinue"}
                ]}
            ]}
        ]}
    ]
});