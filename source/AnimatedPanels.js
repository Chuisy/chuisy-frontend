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
        onInAnimationStart: "",
        onOutAnimationStart: "",
        onInAnimationEnd: "",
        onOutAnimationEnd: ""
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
        this.currentPanel.applyStyle("display", "block");
        this.animationStartHandler = enyo.bind(this, this.animationStart);
        this.animationEndHandler = enyo.bind(this, this.animationEnd);
    },
    rendered: function() {
        this.inherited(arguments);
        this.hasNode().addEventListener("webkitAnimationStart", this.animationStartHandler, false);
        this.hasNode().addEventListener("webkitAnimationEnd", this.animationEndHandler, false);
    },
    animationStart: function(event) {
        if (this.currentPanel && event.target == this.currentPanel.hasNode() && event.animationName == this.currOutAnim) {
            this.outAnimationStart();
        } else if (this.newPanel && event.target == this.newPanel.hasNode() && event.animationName == this.currInAnim) {
            this.inAnimationStart();
        }
    },
    animationEnd: function(event) {
        if (this.currentPanel && event.target == this.currentPanel.hasNode() && event.animationName == this.currOutAnim) {
            this.outAnimationEnd();
        } else if (this.newPanel && event.target == this.newPanel.hasNode() && event.animationName == this.currInAnim) {
            this.inAnimationEnd();
        }
    },
    startInAnimation: function() {
        this.newPanel.applyStyle("opacity", 0);
        this.newPanel.applyStyle("display", "block");
        this.newPanel.applyStyle("-webkit-animation", this.currInAnim + " " + this.duration + "ms");
        this.newPanel.applyStyle("opacity", 1);
    },
    startOutAnimation: function() {
        this.currentPanel.applyStyle("-webkit-animation", this.currOutAnim + " " + this.duration + "ms");
    },
    inAnimationStart: function() {
        this.doInAnimationStart({oldPanel: this.currentPanel, newPanel: this.newPanel});
    },
    outAnimationStart: function() {
        this.doOutAnimationStart({oldPanel: this.currentPanel, newPanel: this.newPanel});
        this.animating = true;
        if (this.async) {
            this.startInAnimation();
        }
    },
    inAnimationEnd: function() {
        this.doInAnimationEnd({oldPanel: this.currentPanel, newPanel: this.newPanel});
        this.newPanel.applyStyle("-webkit-animation", "none");
    },
    outAnimationEnd: function() {
        this.doOutAnimationEnd({oldPanel: this.currentPanel, newPanel: this.newPanel});
        this.currentPanel.applyStyle("display", "none");
        this.currentPanel.applyStyle("-webkit-animation", "none");
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
        this.currOutAnim = outAnim || this.outAnim;
        if (this.animating) {
            this.outAnimationEnd();
        }
        this.newPanel = panel;
        this.startOutAnimation();
        if (this.currOutAnim == AnimatedPanels.NONE) {
            this.outAnimationStart();
            setTimeout(enyo.bind(this, function() {
                this.outAnimationEnd();
            }), this.duration + 500);
        }
        if (!this.async) {
            this.startInAnimation();
        }
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
        {kind: "AnimatedPanels", classes: "enyo-fill", components: [
            {name: "first", style: "background-color: blue", ontap: "next"},
            {name: "second", style: "background-color: red", ontap: "previous"}
        ]}
    ]
});