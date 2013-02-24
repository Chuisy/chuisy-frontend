/**
    _SignInView_ presents a 'Sign In With Facebook' button to the user. _successCallback_ and _failureCallback_
    are called in the respective cases.
*/
enyo.kind({
    name: "SignInView",
    classes: "signinview",
    events: {
        onDone: ""
    },
    published: {
        // Callback that gets called when the user has successfully signed in
        successCallback: function() {},
        // Callback that gets called if the user taps the cancel button or something goes wrong
        failureCallback: function() {},
        cancelButtonLabel: $L("Cancel")
    },
    create: function() {
        this.inherited(arguments);
        this.cancelButtonLabelChanged();
    },
    cancelButtonLabelChanged: function() {
        this.$.cancelButton.setContent(this.cancelButtonLabel);
    },
    ready: function() {
        setTimeout(enyo.bind(this, function() {
            this.addClass("ready");
        }), 500);
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
    openTerms: function() {
        window.location = "http://www.chuisy.com/terms/";
    },
    components: [
        {classes: "signinview-scrim"},
        {classes: "signinview-content", components: [
            {classes: "signinview-spacer"},
            {classes: "signinview-center", components: [
                {classes: "signinview-text", content: $L("Discover fashion, share moments with friends.")},
                {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
                    {classes: "facebook-button-icon"},
                    {content: $L("Sign In With Facebook")}
                ]},
                {kind: "onyx.Button", name: "cancelButton", ontap: "cancel", classes: "signinview-cancel-button"},
                {classes: "signinview-terms", ontap: "openTerms", allowHtml: true, content: $L("By signing in you accept our<br> <span class='link'>terms of use</span>.")}
            ]},
            {classes: "signinview-spacer", components: [
                {kind: "onyx.Spinner", classes: "signinview-spinner", showing: false}
            ]}
        ]}
    ]
});