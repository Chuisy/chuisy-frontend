enyo.kind({
    name: "Guide",
    kind: "FittableRows",
    events: {
        onDone: ""
    },
    create: function() {
        this.inherited(arguments);
        this.$.panels.getAnimator().setDuration(500);
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
        if (event.originator.getActive()) {
            this.goToStep(event.originator.value);
        }
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
    activate: function() {},
    deactivate: function() {},
    components: [
        {classes: "header", components: [
            // {kind: "Button", name: "backButton", content: "zurück", ontap: "previous", classes: "header-button left"},
            {classes: "header-text", content: $L("How it works")}
            // {kind: "Button", name: "forwardButton", content: "weiter", ontap: "next", classes: "header-button right"}
        ]},
        {kind: "Panels", arrangerKind: "CarouselArranger", onTransitionStart: "panelsTransitionStart", fit: true, components: [
            {kind: "Card", classes: "enyo-fill", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: $L("Discover fashion")},
                    {classes: "guide-card-text", content: $L("Discover the newest and prettiest fashion items in the stores of your city. Find out where others go shopping and gain inspiration for your own shopping trips."), allowHtml: true, style: "padding: 0px 30px 15px 30px;"},
                    {kind: "Image", src: "assets/images/guide_front_1.png", style: "width: 220px;"}
                ]},
                {classes: "guide-card-side"}
            ]},
            {kind: "Card", classes: "enyo-fill", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: $L("Snap fashion items")},
                    {classes: "guide-card-text", content: $L("Take pictures of fashion items you adore. You decide whether you want to share your discoveries with your friends or keep them to yourself.")},
                    {kind: "Image", src: "assets/images/guide_front_2.png", style: "width: 100px; margin: 12px;"}
                ]},
                {classes: "guide-card-side"}
            ]},
            {kind: "Card", classes: "enyo-fill", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: $L("Collect gifts")},
                    {classes: "guide-card-text", content: $L("You can receive unique gifts by posting products on Chuisy. Collect discounts on your favourite pieces and get many other small goodies!")},
                    {kind: "Image", src: "assets/images/guide_front_3.png", style: "width: 250px;"}
                ]},
                {classes: "guide-card-side"}
            ]},
            {kind: "Card", classes: "enyo-fill", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: $L("Join now")},
                    {classes: "guide-card-text", style: "padding: 10px 25px;", content: $L("You can only connect with your friends and collect unlimited goodies if you sign in. Your data is safe with us and we won't post anything without asking you!")},
                    {kind: "SignInButton", onSignInSuccess: "doDone", onSignInFail: "doDone", style: "margin-top: 20px;"},
                    {kind: "Button", classes: "btn", content: $L("Browse anonymously"), style: "width: 240px; margin-top: 8px;", ontap: "doDone"}
                ]},
                {classes: "guide-card-side"}
            ]}
        ]},
        {kind: "Group", name: "ghosts", classes: "guide-card-ghost", ontap: "stepSelected", style: "margin-bottom: 15px;", components: [
            {kind: "Button", classes: "guide-card-ghost-bullet", value: 0, active: true},
            {kind: "Button", classes: "guide-card-ghost-bullet", value: 1},
            {kind: "Button", classes: "guide-card-ghost-bullet", value: 2},
            {kind: "Button", classes: "guide-card-ghost-bullet", value: 3}
        ]}
    ]
});