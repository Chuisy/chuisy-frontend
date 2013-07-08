enyo.kind({
    name: "Guide",
    kind: "FittableRows",
    events: {
        onDone: ""
    },
    next: function() {
        this.goToStep(this.$.panels.getIndex() + 1);
        return true;
    },
    previous: function() {
        this.goToStep(this.$.panels.getIndex() - 1);
        return true;
    },
    flip: function() {
        this.$.panels.getClientControls()[this.$.panels.getIndex()].flip();
        return true;
    },
    goToStep: function(step) {
        this.$.panels.setIndex(step);
        return true;
    },
    stepSelected: function(sender, event) {
        this.goToStep(sender.value);
    },
    panelsTransitionStart: function(sender, event) {
        var step = event.toIndex;
        var ghost = this.$.ghosts.getClientControls()[step];
        if (ghost) {
            ghost.setActive(true);
        }
        // this.$.forwardButton.setShowing(step < 3);
        // this.$.backButton.setShowing(step > 0);
    },
    activate: function() {
        this.resized();
    },
    deactivate: function() {},
    components: [
        {classes: "header", components: [
            {classes: "header-text", content: $L("How it works")}
        ]},
        {kind: "Carousel", name: "panels", onTransitionStart: "panelsTransitionStart", fit: true, components: [
            {kind: "Card", classes: "enyo-fill", components: [
                {classes: "guide-card-side", style: "background: url(assets/images/guide_front_1.jpg) no-repeat center bottom #fff; background-size: 300px 153px;", components: [
                    {classes: "guide-card-title", content: $L("Discover fashion")},
                    {classes: "guide-card-text", content: $L("Discover the prettiest fashion items in your city. See where others go shopping and find inspiration for your own shopping trips!")}
                ]},
                {classes: "guide-card-side"}
            ]},
            {kind: "Card", classes: "enyo-fill", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: $L("Snap fashion items")},
                    {classes: "guide-card-text", content: $L("Take pictures of your favourite fashion items while shopping and collect gifts. You decide if you want to share your discoveries with your friends or keep them to yourself."), style: "padding: 10px 25px 25px 25px;"},
                    {kind: "Image", src: "assets/images/guide_front_2.png", style: "width: 200px; height: 100px"}
                ]},
                {classes: "guide-card-side"}
            ]},
            {kind: "Card", classes: "enyo-fill", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: $L("Join now")},
                    {classes: "guide-card-text", content: $L("Sign in to connect with your friends and use all of Chuisy's features. Your data is safe with us and we won't post anything without asking you!"), style: "padding: 10px 25px 30px 25px;"},
                    {kind: "SignInButton", onSignInSuccess: "doDone", onSignInFail: "doDone"},
                    {kind: "Button", content: $L("Browse anonymously"), classes: "signin-cancel-button", ontap: "doDone"}
                ]},
                {classes: "guide-card-side"}
            ]}
        ]},
        {kind: "Group", name: "ghosts", classes: "guide-card-ghost", style: "margin-bottom: 15px;", components: [
            {kind: "Button", classes: "guide-card-ghost-bullet", ontap: "stepSelected", value: 0, active: true},
            {kind: "Button", classes: "guide-card-ghost-bullet", ontap: "stepSelected", value: 1},
            {kind: "Button", classes: "guide-card-ghost-bullet", ontap: "stepSelected", value: 2}
        ]}
    ]
});