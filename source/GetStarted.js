enyo.kind({
    name: "GetStarted",
    classes: "getstarted",
    events: {
        onDone: ""
    },
    signIn: function() {
        App.loginWithFacebook(enyo.bind(this, function(accessToken) {
            chuisy.signIn({fb_access_token: accessToken}, enyo.bind(this, function() {
                // Use facebook access token to get authentication credentials from Chuisy API
                // this.$.panels.setIndex(1);
                this.doDone();
            }), enyo.bind(this, function() {
                navigator.notification.alert("Hm, that didn't work. Please try it again later!", enyo.bind(this, function() {
                    this.doDone();
                }, "Authentication failed", "OK"));
            }));
        }));
    },
    components: [
        {kind: "Panels", classes: "enyo-fill", components: [
            {classes: "getstarted-login", components: [
                {classes: "getstarted-login-text", content: "Hi there, stranger! Wanna tell me your name?"},
                {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
                    {classes: "facebook-button-icon"},
                    {content: "Sign In With Facebook"}
                ]},
                {kind: "onyx.Button", content: "No way!", ontap: "doDone"}
            ]}
        ]}
    ]
});