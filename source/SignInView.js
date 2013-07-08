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
    handlers: {
        tap: ""
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
        // this.$.cancelButton.setContent(this.context == "start" ? $L("Browse anonymously") : $L("Cancel"));
        this.$.signInButton.setContext(this.context);
    },
    open: function() {
        this.show();
        enyo.asyncMethod(this, function() {
            this.addClass("show");
        });
    },
    close: function() {
        this.removeClass("show");
        setTimeout(enyo.bind(this, function() {
            this.hide();
        }), 500);
    },
    signInSuccess: function() {
        if (this.successCallback) {
            this.successCallback();
        }
        this.successCallback = null;
        this.failureCallback = null;
        this.doDone({success: true});
    },
    signInFail: function() {
        if (this.failureCallback) {
            this.failureCallback();
        }
        this.successCallback = null;
        this.failureCallback = null;
        this.doDone({success: false});
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
        this.doDone({success: false});
        if (event) {
            event.preventDefault();
        }
        App.sendCubeEvent("action", {
            type: "signin",
            result: "cancel",
            context: this.context
        });
    },
    tap: function(sender, event) {
        if (!event.originator.isDescendantOf(this.$.front)) {
            this.cancel();
        }
    },
    components: [
        {kind: "Card", classes: "enyo-fill signinview-card", components: [
            {name: "front", classes: "signinview-card-front", components: [
                {kind: "Image", src: "assets/images/friends_placeholder.png", classes: "signinview-image"},
                {classes: "signinview-text",
                    content: $L("Connect with Facebook now if you want to to use all of Chuisy's features! Don't worry, we won't post anything in your name without asking you!")},
                {kind: "SignInButton", onSignInSuccess: "signInSuccess", onSignInFail: "signInFail", classes: "signinview-signin-button"}
            ]}
        ]}
    ]
});