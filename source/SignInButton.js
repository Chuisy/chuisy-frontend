enyo.kind({
    name: "SignInButton",
    style: "display: inline-block; position: relative; text-align: center;",
    events: {
        onSignInSuccess: "",
        onSignInFail: ""
    },
    published: {
        context: "other"
    },
    signIn: function() {
        this.$.button.setDisabled(true);
        this.$.spinner.setShowing(true);
        App.sendCubeEvent("signin_tap", {
            context: this.context
        });
        if (App.checkConnection()) {
            App.loginWithFacebook(enyo.bind(this, function(accessToken) {
                chuisy.signIn(accessToken, enyo.bind(this, function() {
                    this.$.button.setDisabled(false);
                    this.$.spinner.setShowing(false);
                    this.doSignInSuccess();
                }), enyo.bind(this, function() {
                    this.$.button.setDisabled(false);
                    this.$.spinner.setShowing(false);
                    navigator.notification.alert($L("Hm, that didn't work. Please try again later!"), enyo.bind(this, function() {
                        this.doSignInFail();
                    }, $L("Authentication failed"), $L("OK")));
                }));
            }), enyo.bind(this, function() {
                this.$.button.setDisabled(false);
                this.$.spinner.setShowing(false);
                this.doSignInFail();
            }));
        } else {
            this.$.button.setDisabled(false);
            this.$.spinner.setShowing(false);
            this.doSignInFail();
        }
        return true;
    },
    components: [
        {kind: "Button", name: "button", classes: "facebook-button", ontap: "signIn", components: [
            {classes: "facebook-button-icon"},
            {classes: "facebook-button-caption", content: $L("Sign in with Facebook")}
        ]},
        {name: "spinner", kind: "Spinner", classes: "absolute-center", showing: false}
    ]
});