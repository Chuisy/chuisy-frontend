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
                chuisy.signIn(accessToken, enyo.bind(this, function() {
                    this.$.spinner.hide();
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
                {classes: "getstarted-login-logo"},
                {classes: "getstarted-login-buttons", components: [
                    {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
                        {classes: "facebook-button-icon"},
                        {content: $L("Sign In With Facebook")}
                    ]},
                    {kind: "onyx.Button", content: $L("Skip"), ontap: "doDone"},
                    {kind: "onyx.Spinner", classes: "getstarted-login-spinner", showing: false}
                ]}
            ]}
        ]}
    ]
});