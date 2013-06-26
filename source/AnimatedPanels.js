enyo.kind({
    name: "AnimatedPanels",
    classes: "animatedpanels",
    statics: {
        SLIDE_IN_FROM_RIGHT: "slideInFromRight",
        SLIDE_OUT_TO_LEFT: "slideOutToLeft",
        SLIDE_IN_FROM_TOP: "slideInFromTop",
        SLIDE_OUT_TO_BOTTOM: "slideOutToBottom",
        SLIDE_IN_FROM_LEFT: "slideInFromLeft",
        SLIDE_OUT_TO_RIGHT: "slideOutToRight",
        SLIDE_IN_FROM_BOTTOM: "slideInFromBottom",
        SLIDE_OUT_TO_TOP: "slideOutToTop",
        FADE_OUT: "fadeOut",
        FADE_IN: "fadeIn",
        NONE: "none"
    },
    events: {
        onAnimationStart: "",
        onAnimationEnd: ""
    },
    published: {
        // If true, the out animation of the old panel will be started as soon as possible
        // instead of waiting for the new panel to be rendered and painted. The result
        // is a decoupled in and out animation
        async: false,
        inAnim: "slideInFromRight",
        outAnim: "slideOutToLeft",
        duration: 500
    },
    create: function() {
        this.inherited(arguments);
        this.currentPanel = this.getClientControls()[0];
        // this.currentPanel.applyStyle("-webkit-transform", "translate3d(0, 0, 0)");
        this.currentPanel.applyStyle("display", "block");
        this.animationStartHandler = enyo.bind(this, this.animationStart);
        this.animationEndHandler = enyo.bind(this, this.animationEnd);
        this.fireAnimationStart = enyo.bind(this, function() {
            this.newPanel.hasNode().removeEventListener("webkitAnimationStart", this.fireAnimationStart, false);
            this.doAnimationStart({oldPanel: this.currentPanel, newPanel: this.newPanel});
        });
    },
    animationStart: function() {
        this.currentPanel.hasNode().removeEventListener("webkitAnimationStart", this.animationStartHandler, false);
        this.newPanel.applyStyle("display", "block");
        this.newPanel.applyStyle("-webkit-animation", this.currInAnim + " " + this.duration + "ms");
        this.newPanel.applyStyle("opacity", 1);
        this.newPanel.resized();
    },
    animationEnd: function() {
        this.doAnimationEnd({oldPanel: this.currentPanel, newPanel: this.newPanel});
        this.currentPanel.applyStyle("display", "none");
        this.currentPanel.hasNode().removeEventListener("webkitAnimationEnd", this.animationEndHandler, false);
        this.currentPanel = this.newPanel;
        // this.newPanel = null;
        this.animating = false;
    },
    select: function(panel, inAnim, outAnim) {
        if (!panel) {
            this.warn("The panel you selected is null or undefined!");
            return;
        }
        if (panel == this.newPanel || panel == this.currentPanel) {
            // this.log("This panel is already selected.");
            return;
        }
        this.currInAnim = inAnim || this.inAnim;
        outAnim = outAnim || this.outAnim;
        if (this.animating) {
            this.animationEnd();
        }
        this.newPanel = panel;
        this.newPanel.applyStyle("opacity", 0);
        this.animating = true;
        this.newPanel.hasNode().addEventListener("webkitAnimationStart", this.fireAnimationStart, false);

        if (this.async) {
            this.currentPanel.hasNode().addEventListener("webkitAnimationStart", this.animationStartHandler, false);
        } else {
            this.animationStart();
        }
        if (outAnim != AnimatedPanels.NONE) {
            this.currentPanel.hasNode().addEventListener("webkitAnimationEnd", this.animationEndHandler, false);
        } else {
            setTimeout(enyo.bind(this, function() {
                this.animationEnd();
            }), this.duration + 500);
        }
        this.currentPanel.applyStyle("-webkit-animation", outAnim + " " + this.duration + "ms");
    },
    selectDirect: function(panel) {
        if (this.currentPanel == panel) {
            return;
        }
        panel.applyStyle("display", "block");
        this.currentPanel.applyStyle("display", "none");
        this.currentPanel = panel;
    },
    selectByIndex: function(index, inAnim, outAnim) {
        this.select(this.getClientControls()[index], inAnim, outAnim);
    },
    getSelectedPanel: function() {
        return this.currentPanel;
    },
    getSelectedPanelIndex: function() {
        return this.getClientControls().indexOf(this.currentPanel);
    }
});

enyo.kind({
    name: "AnimatedPanelsTest",
    next: function() {
        this.$.animatedPanels.select(this.$.second);
    },
    previous: function() {
        this.$.animatedPanels.select(this.$.first, AnimatedPanels.SLIDE_IN_FROM_LEFT, AnimatedPanels.SLIDE_OUT_TO_RIGHT);
    },
    animationStart: function() {
        this.log("***** animation start *****", arguments);
    },
    animationEnd: function() {
        this.log("***** animation end *****", arguments);
    },
    components: [
        {kind: "AnimatedPanels", onAnimationStart: "animationStart", onAnimationEnd: "animationEnd", classes: "enyo-fill", components: [
            {name: "first", style: "background-color: blue", ontap: "next"},
            {name: "second", style: "background-color: red", ontap: "previous"}
        ]}
    ]
});