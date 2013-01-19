enyo.kind({
    name: "GetStarted",
    classes: "getstarted",
    events: {
        onDone: ""
    },
    signIn: function() {
        if (App.checkConnection()) {
            App.loginWithFacebook(enyo.bind(this, function(accessToken) {
                this.$.spinner.show();
                chuisy.signIn({fb_access_token: accessToken}, enyo.bind(this, function() {
                    this.$.spinner.hide();
                    // Use facebook access token to get authentication credentials from Chuisy API
                    // this.$.panels.setIndex(1);
                    this.doDone();
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
    components: [
        {kind: "Panels", classes: "enyo-fill", components: [
            {classes: "getstarted-login", components: [
                {classes: "getstarted-login-text", content: $L("Hi there, stranger! Wanna tell me your name?")},
                {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
                    {classes: "facebook-button-icon"},
                    {content: $L("Sign In With Facebook")}
                ]},
                {kind: "onyx.Button", content: $L("No way!"), ontap: "doDone"}
            ]}
        ]},
        {kind: "onyx.Spinner", classes: "absolute-center", showing: false}
    ]
});