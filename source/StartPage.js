enyo.kind({
    name: "StartPage",
    classes: "startpage",
    kind: "FittableRows",
    events: {
        onSignIn: "",
        onSignup: ""
    },
    facebookSignIn: function() {
        window.location = "https://www.facebook.com/dialog/oauth?client_id=180626725291316&redirect_uri=http://chuisy.com:8000/v1/fb_auth/&scope=user_birthday,user_location,user_about_me";
    },
    showSignUp: function() {
        this.$.signInPanels.setIndex(1);
    },
    showSignIn: function() {
        this.$.signInPanels.setIndex(0);
    },
    signupHandler: function(sender, event) {
        chuisy.signUp(event.data, enyo.bind(this, function(sender, response) {
            this.doSignup({user: response});
        }));
    },
    signIn: function() {
        chuisy.signIn(this.$.username.getValue(), this.$.password.getValue(), enyo.bind(this, function(success) {
            if (success) {
                this.doSignIn();
            }
            this.$.signInError.setShowing(!success);
        }));
    }, 
    components: [
        {classes: "mainheader", components: [
            {classes: "mainheader-text", fit: true, content: "chuisy", style: "width: 100%"}
        ]},
        {fit: true, classes: "startpage-content", components: [
            {kind: "Panels", name: "signInPanels", arrangerKind: "CarouselArranger", classes: "startpage-signin-panels", components: [
                {classes: "startpage-signin", components: [
                    {kind: "onyx.Button", classes: "facebook-login-button", content: "Sign In With Facebook", ontap: "facebookSignIn"},
                    {kind: "onyx.Groupbox", components: [
                        {kind: "onyx.InputDecorator", components: [
                            {kind: "onyx.Input", style: "width: 100%", name: "username", placeholder: "Username or Email"}
                        ]},
                        {kind: "onyx.InputDecorator", components: [
                            {kind: "onyx.Input", style: "width: 100%", name: "password", type: "password", placeholder: "Password"}
                        ]}
                    ]},
                    {classes: "startpage-signin-error", name: "signInError", content: "Wrong username or password.", showing: false},
                    {kind: "onyx.Button", classes: "onyx-affirmative", content: "Sign In", ontap: "signIn"},
                    {classes: "startpage-signup-link", ontap: "showSignUp", content: "Register with email >"}
                ]},
                {classes: "startpage-signup", components: [
                    {kind: "SignUpForm", onSubmit: "signupHandler"},
                    {classes: "startpage-signin-link", ontap: "showSignIn", content: "< Sign in"}
                ]}
            ]}
        ]}
    ]
});