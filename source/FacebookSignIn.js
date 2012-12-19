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
        this.loginWithFacebook(enyo.bind(this, function(accessToken) {
            // User facebook access token to get authentication credentials from Chuisy API
            chuisy.signIn({fb_access_token: accessToken}, enyo.bind(this, function() {
                if (this.successCallback) {
                    this.successCallback();
                }
                this.successCallback = null;
                this.failureCallback = null;
                this.doDone();
            }), enyo.bind(this, function() {
                alert("Authentication failed!");
            }));
        }));
    },
    /**
        Retrieves a facebook access token from the appropriate sdk and calls _callback_ with the result
    */
    loginWithFacebook: function(callback) {
        if (window.plugins && window.plugins.facebookConnect) {
            window.plugins.facebookConnect.login({permissions: ["email", "user_about_me", "user_birthday", "user_location", "user_website", "publish_actions"], appId: "180626725291316"}, enyo.bind(this, function(result) {
                if(result.cancelled || result.error) {
                    this.log("Facebook signin failed:" + result.message);
                    return;
                }
                callback(result.accessToken);
            }));
        } else if (FB) {
            FB.login(function() {
                if (response.status == "connected") {
                    callback(response.authResponse.accessToken);
                } else {
                    console.log("Facebook signin failed!");
                }
            }, {scope: "user_birthday,user_location,user_about_me,user_website,email,publish_actions"});
        } else {
            this.error("No facebook sdk found!");
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
    },
    components: [
        {classes: "facebooksignin-placeholder"},
        {classes: "facebooksignin-text", content: "Connect with your Facebook account to share products with your friends, interact with other people on Chuisy and claim gifts from our local retail partners!"},
        {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
            {classes: "facebook-button-icon"},
            {content: "Sign In With Facebook"}
        ]},
        {kind: "onyx.Button", content: "Cancel", ontap: "cancel", classes: "facebooksignin-cancel-button"}
    ]
});