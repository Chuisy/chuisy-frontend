enyo.kind({
    name: "Card",
    classes: "card-stage",
    events: {
        onDismiss: ""
    },
    handlers: {
        onflick: "flick",
        onhold: "hold",
        ondragstart: "dragstart",
        ondrag: "drag",
        ondragfinish: "dragfinish",
        ontap: "tap"
    },
    create: function() {
        this.inherited(arguments);
        var sides = this.getClientControls();
        while (sides.length < 2) {
            var side = this.$.client.createComponent({});
            sides.push(side);
        }
        sides[0].addClass("card-side front");
        sides[1].addClass("card-side back");
    },
    tap: function(sender, event) {
        if (!event.originator.isDescendantOf(this.$.client)) {
            this.doDismiss();
        }
    },
    //* Whether or not the scroller is actively moving
    isScrolling: function() {
        return this.$.scrollMath.isScrolling();
    },
    flick: function(inSender, e) {
        var onAxis = Math.abs(e.xVelocity) > Math.abs(e.yVelocity) ? this.$.scrollMath.horizontal : this.$.scrollMath.vertical;
        if (onAxis && this.dragging) {
            this.$.scrollMath.flick(e);
        }
    },
    hold: function(inSender, e) {
        this.$.scrollMath.stop(e);
        return true;
    },
    // Special synthetic DOM events served up by the Gesture system
    dragstart: function(inSender, inEvent) {
        // Ignore drags sent from multi-touch events
        if(inEvent.srcEvent.touches && inEvent.srcEvent.touches.length > 1) {
            return true;
        }
        this.dragging=true;
        if (this.dragging) {
            inEvent.preventDefault();
            this.$.scrollMath.startDrag(inEvent);
        }
    },
    drag: function(inSender, inEvent) {
        if (this.dragging) {
            inEvent.preventDefault();
            this.$.scrollMath.drag(inEvent);
        }
    },
    dragfinish: function(inSender, inEvent) {
        if (this.dragging) {
            inEvent.preventTap();
            this.$.scrollMath.dragFinish();
            this.dragging = false;
        }
    },
    scrollMathScroll: function(inSender) {
        if (!this.isAnimating) {
            var rotOffset = this.flipped ? 180 : 0;
            var rotFactor = 0.3;
            var rotX = -rotFactor * (inSender.y - inSender.topBoundary);
            var rotY = rotFactor * (inSender.x - inSender.leftBoundary) + rotOffset;
            this.$.client.applyStyle("-webkit-transform", "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)");
        }
    },
    flip: function() {
        this.flipped = !this.flipped;
        var rotOffset = this.flipped ? 180 : 0;
        this.$.client.addClass("elastic");
        this.isAnimating = true;
        this.$.client.applyStyle("-webkit-transform", "rotateY(" + rotOffset + "deg)");
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
        this.animationTimeout = setTimeout(enyo.bind(this, function() {
            this.$.client.removeClass("elastic");
            this.isAnimating = false;
        }), 500);
    },
    components: [
        {name: "client", classes: "card"},
        {kind: "ScrollMath", onScrollStart: "scrollMathStart", onScroll: "scrollMathScroll", onScrollStop: "scrollMathStop",
            leftBoundary: 0, rightBoundary: 0, vertical: true, horizontal: true}
    ]
});

enyo.kind({
    name: "CardTest",
    flipCard: function() {
        this.$.card.flip();
    },
    components: [
        {kind: "Card", classes: "enyo-fill", components: [
            {ontap: "flipCard"},
            {ontap: "flipCard"}
        ]}
    ]
});