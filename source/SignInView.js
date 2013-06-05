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
        context: "start"
    },
    create: function() {
        this.inherited(arguments);
        this.contextChanged();
    },
    contextChanged: function() {
        this.$.primaryText.setShowing(this.context == "start");
        this.$.secondaryText.setShowing(this.context != "start");
        this.$.cancelButton.setContent(this.context == "start" ? $L("Browse anonymously") : $L("Cancel"));
        this.$.signInButton.setContext(this.context);
    },
    ready: function() {
        // setTimeout(enyo.bind(this, function() {
            this.addClass("ready");
        // }), 500);
    },
    signInSuccess: function() {
        this.log("sign in success!");
        if (this.successCallback) {
            this.successCallback();
        }
        this.successCallback = null;
        this.failureCallback = null;
        this.doDone();
    },
    signInFail: function() {
        if (this.failureCallback) {
            this.failureCallback();
        }
        this.successCallback = null;
        this.failureCallback = null;
        this.doDone();
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
        App.sendCubeEvent("signin_cancel", {
            context: this.context
        });
    },
    components: [
        {classes: "signinview-scrim"},
        {classes: "signinview-content", components: [
            {classes: "signinview-spacer"},
            {classes: "signinview-center", components: [
                {name: "primaryText", classes: "signinview-text", allowHtml: true, content: $L("The perfect shopping experience with friends.")},
                {name: "secondaryText", classes: "signinview-text", style: "font-size: 13pt;", showing: false,
                    content: $L("Connect with Facebook now if you want to to use all of Chuisy's features! Don't worry, we won't post anything in your name without asking you!")},
                {kind: "SignInButton", onSignInSuccess: "signInSuccess", onSignInFail: "signInFail", style: "display: block; margin: 0 auto;"},
                {kind: "Button", name: "cancelButton", style: "width: 240px; display: block; margin: 5px auto;", ontap: "cancel"},
                {classes: "signinview-terms", allowHtml: true, content: $L("By signing in you accept our<br><a href='http://www.chuisy.com/terms/' target='_blank' class='link'>terms of use</a> and <a href='http://www.chuisy.com/privacy/' target='_blank' class='link'>privacy policy</a>.")}
            ]},
            {classes: "signinview-spacer"}
        ]}
    ]
});