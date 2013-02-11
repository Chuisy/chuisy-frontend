/**
    _FacebookSignIn_ presents a 'Sign In With Facebook' button to the user. _successCallback_ and _failureCallback_
    are called in the respective cases.
*/
enyo.kind({
    name: "FacebookSignIn",
    classes: "facebooksignin",
    events: {
        onDone: ""
    },
    published: {
        // Callback that gets called when the user has successfully signed in
        successCallback: function() {},
        // Callback that gets called if the user taps the cancel button or something goes wrong
        failureCallback: function() {}
    },
    /**
        Gets a facebook access token and exchanges it for Chuisy api authentication credentials
    */
    signIn: function() {
        // Get facebook access token
        if (App.checkConnection()) {
            App.loginWithFacebook(enyo.bind(this, function(accessToken) {
                this.$.spinner.show();
                // User facebook access token to get authentication credentials from Chuisy API
                chuisy.signIn(accessToken, enyo.bind(this, function() {
                    this.$.spinner.hide();
                    if (this.successCallback) {
                        this.successCallback();
                    }
                    this.successCallback = null;
                    this.failureCallback = null;
                    this.doDone();
                }), enyo.bind(this, function() {
                    this.$.spinner.hide();
                    navigator.notification.alert($L("Hm, that didn't work. Please try again later!"), function() {}, $L("Authentication failed"), $L("OK"));
                }));
            }));
        } else {
            if (this.failureCallback) {
                this.failureCallback();
            }
            this.doDone();
        }
        if (event) {
            event.preventDefault();
        }
    },
    /**
        Calls _failureCallback_ and fires done event
    */
    cancel: function() {
        if (this.failureCallback) {
            this.failureCallback();
        }
        this.successCallback = null;
        this.failureCallback = null;
        this.doDone();
        if (event) {
            event.preventDefault();
        }
    },
    components: [
        {classes: "facebooksignin-placeholder"},
        {classes: "facebooksignin-text", content: $L("Connect with your Facebook account to share products with your friends, interact with other people on Chuisy and claim gifts from our local retail partners!")},
        {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
            {classes: "facebook-button-icon"},
            {content: $L("Sign In With Facebook")}
        ]},
        {kind: "onyx.Button", content: $L("Cancel"), ontap: "cancel", classes: "facebooksignin-cancel-button"},
        {kind: "onyx.Spinner", classes: "facebooksignin-spinner", showing: false}
    ]
});