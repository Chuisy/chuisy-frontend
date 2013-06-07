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
        SLIDE_OUT_TO_TOP: "slideOutToTop"
    },
    events: {
        onAnimationEnd: ""
    },
    create: function() {
        this.inherited(arguments);
        this.currentPanel = this.getClientControls()[0];
        // this.currentPanel.applyStyle("-webkit-transform", "translate3d(0, 0, 0)");
        this.currentPanel.applyStyle("display", "block");
        this.animationEndHandler = enyo.bind(this, this.animationEnd);
    },
    animationEnd: function() {
        // this.newPanel.applyStyle("-webkit-transform", "translate3d(0, 0, 0)");
        // this.newPanel.applyStyle("-webkit-transform", "");
        // this.newPanel.applyStyle("opacity", 1);
        this.currentPanel.applyStyle("display", "none");
        this.currentPanel.hasNode().removeEventListener("webkitAnimationEnd", this.animationEndHandler, false);
        this.currentPanel = this.newPanel;
        this.newPanel = null;
        this.animating = false;
        this.doAnimationEnd();
    },
    select: function(panel, inAnim, outAnim) {
        if (!panel) {
            this.warn("The panel you selected is null or undefined!");
            return;
        }
        if (panel == this.newPanel || !this.newPanel && panel == this.currentPanel) {
            this.log("This panel is already selected.");
            return;
        }
        inAnim = inAnim || AnimatedPanels.SLIDE_IN_FROM_RIGHT;
        outAnim = outAnim || AnimatedPanels.SLIDE_OUT_TO_LEFT;
        if (this.animating) {
            this.animationEnd();
        }
        this.newPanel = panel;
        // this.newPanel.applyStyle("-webkit-transform", "translate3d(100%, 0, 0)");
        this.newPanel.applyStyle("opacity", 0);
        this.newPanel.applyStyle("display", "block");
        // enyo.asyncMethod(this, function() {
            this.animating = true;
            this.currentPanel.hasNode().addEventListener("webkitAnimationEnd", this.animationEndHandler, false);
            // enyo.asyncMethod(this, function() {
                this.currentPanel.applyStyle("-webkit-animation", outAnim + " 0.5s");
                this.newPanel.applyStyle("-webkit-animation", inAnim + " 0.5s");
                this.newPanel.applyStyle("opacity", 1);
            // });
        // });
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
    components: [
        {kind: "AnimatedPanels", classes: "enyo-fill", components: [
            {name: "first", style: "background-color: blue", ontap: "next"},
            {name: "second", style: "background-color: red", ontap: "previous"}
        ]}
    ]
});