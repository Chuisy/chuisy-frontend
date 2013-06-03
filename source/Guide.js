enyo.kind({
    name: "Guide",
    kind: "FittableRows",
    next: function() {
        this.goToStep(this.$.animatedPanels.getSelectedPanelIndex() + 1);
        return true;
    },
    previous: function() {
        this.goToStep(this.$.animatedPanels.getSelectedPanelIndex() - 1);
        return true;
    },
    flip: function() {
        this.$.animatedPanels.getSelectedPanel().flip();
        return true;
    },
    goToStep: function(step) {
        if (step < this.$.animatedPanels.getSelectedPanelIndex()) {
            this.$.animatedPanels.selectByIndex(step, AnimatedPanels.SLIDE_IN_FROM_LEFT, AnimatedPanels.SLIDE_OUT_TO_RIGHT);
        } else {
            this.$.animatedPanels.selectByIndex(step);
        }
        var ghost = this.$.ghosts.getClientControls()[step];
        if (ghost) {
            ghost.setActive(true);
        }
        this.$.forwardButton.setShowing(step < 3);
        this.$.backButton.setShowing(step > 0);
        return true;
    },
    stepSelected: function(sender, event) {
        if (event.originator.getActive()) {
            this.goToStep(event.originator.value);
        }
    },
    signIn: function() {
        this.$.facebookButton.setDisabled(true);
        this.$.facebookSpinner.setShowing(true);
        App.sendCubeEvent("signin_tap", {
            context: "guide"
        });
        if (App.checkConnection()) {
            App.loginWithFacebook(enyo.bind(this, function(accessToken) {
                chuisy.signIn(accessToken, enyo.bind(this, function() {
                    this.$.facebookButton.setDisabled(false);
                    this.$.facebookSpinner.setShowing(false);
                }), enyo.bind(this, function() {
                    this.$.facebookButton.setDisabled(false);
                    this.$.facebookSpinner.setShowing(false);
                    navigator.notification.alert($L("Hm, that didn't work. Please try again later!"), enyo.bind(this, function() {
                    }, $L("Authentication failed"), $L("OK")));
                }));
            }));
        }
        return true;
    },
    components: [
        {classes: "header", components: [
            {kind: "Button", name: "backButton", content: "zurück", ontap: "previous", classes: "header-button left"},
            {classes: "header-text", content: "So funktioniert's"},
            {kind: "Button", name: "forwardButton", content: "weiter", ontap: "next", classes: "header-button right"}
        ]},
        {kind: "AnimatedPanels", fit: true, ontap: "flip", components: [
            {kind: "Card", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: "Mode entdecken"},
                    {classes: "guide-card-text", content: "Entdecke die schönsten und aktuellsten Modeartikel in den Geschäften deiner Stadt. Sieh, wo andere shoppen gehen und lass dich inspirieren.", style: "padding: 0px 30px 15px 30px;"},
                    {kind: "Image", src: "assets/images/guide_front_1.png", style: "width: 220px;"}
                ]},
                {classes: "guide-card-side"}
            ]},
            {kind: "Card", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: "Photos machen"},
                    {classes: "guide-card-text", content: "Fotografiere die Produkte die dir am besten gefallen, wenn du shoppen gehst. Du kannst selbst entschieden ob du deine Entdeckungen für dich behältst oder mit Freunden und Familie teilst."},
                    {kind: "Image", src: "assets/images/guide_front_2.png", style: "width: 125px; border-radius: 200px; border: solid 2px rgba(0, 0, 0, 0.2)"},
                    {classes: "post-chu-button"}
                ]},
                {classes: "guide-card-side"}
            ]},
            {kind: "Card", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: "Geschenke sammeln"},
                    {classes: "guide-card-text", content: "Wenn du Entdeckungen mit Chuisy teilst, kannst du individuelle Geschenke sammeln. Bekomme Rabatte auf genau die Produkte, die du haben willst und sammle Badges und viele andere kleine Geschenke!"},
                    {kind: "Image", src: "assets/images/guide_front_3.png", style: "width: 250px;"}
                ]},
                {classes: "guide-card-side"}
            ]},
            {kind: "Card", components: [
                {classes: "guide-card-side", components: [
                    {classes: "guide-card-title", content: "Jetzt loslegen"},
                    {classes: "guide-card-text", style: "padding-top: 10px;", content: "Wenn du dich mit Facebook anmeldest, kannst du dich mit deinen Freunden verbinden und uneingeschränkt Geschenke sammeln. Deine Daten sind sicher und wir posten nicht, ohne dich zu fragen."},
                    {style: "display: inline-block; position: relative; margin-top: 20px;", components: [
                        {kind: "Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
                            {classes: "facebook-button-icon"},
                            {classes: "facebook-button-caption", content: "Mit Facebook anmelden"}
                        ]},
                        {name: "facebookSpinner", kind: "CssSpinner", classes: "absolute-center", showing: false}
                    ]},
                    {kind: "Button", classes: "btn", content: "Erstmal stöbern", style: "width: 255px; margin-top: 8px;"}
                ]},
                {classes: "guide-card-side"}
            ]}
        ]},
        {kind: "Group", name: "ghosts", classes: "guide-card-ghost", onActivate: "stepSelected", style: "margin-bottom: 15px;", components: [
            {kind: "Button", classes: "guide-card-ghost-bullet", value: 0, active: true},
            {kind: "Button", classes: "guide-card-ghost-bullet", value: 1},
            {kind: "Button", classes: "guide-card-ghost-bullet", value: 2},
            {kind: "Button", classes: "guide-card-ghost-bullet", value: 3}
        ]}
    ]
});