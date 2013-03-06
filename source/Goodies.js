enyo.kind({
	name: "Goodies",
	classes: "goodies",
	getCardCoords: function(item) {
		var ib = item.getBounds();
		var cb = this.$.card.getBounds();
		var sb = this.$.stage.getBounds();
		var scale = ib.width/cb.width;
		var perspective = 1000;
		xOffset = (sb.width - ib.width)/2;
		yOffset = (sb.height - ib.height)/2;

		return {
			dx: (ib.left - xOffset) / scale,
			dy: (ib.top - yOffset - this.$.scroller.getScrollTop()) / scale,
			dz: perspective * (1 - 1/scale),
			scale: scale
		};
	},
	showCard: function(sender) {
		this.item = sender;
		this.$.stage.show();

		var coords = this.getCardCoords(this.item);
		var ib = this.item.getBounds();
		var cb = this.$.card.getBounds();
		var ratio = ib.height/ib.width;
		this.log(ib, cb, ratio);
		this.$.card.applyStyle("height", (ratio * cb.width) + "px");
		this.$.front.applyStyle("background-size", (80/coords.scale) + "px " + (40/coords.scale) + "px");

		this.item.applyStyle("visibility", "hidden");
		this.$.card.addClass("notransition");
		this.$.card.applyStyle("-webkit-transform", "translate3d(" + coords.dx + "px, " + coords.dy + "px, " + coords.dz + "px) rotateY(0deg)");
		enyo.asyncMethod(this, function() {
			this.$.card.removeClass("notransition");
			this.$.card.applyStyle("-webkit-transform", "translate3d(0, 0, 0) rotateY(180deg)");
		});
	},
	hideCard: function(sender, event) {
		// if (event.originator.isDescendantOf(this.$.card)) {
		// 	return;
		// }

		var coords = this.getCardCoords(this.item);

		this.$.card.removeClass("notransition");
		this.$.card.applyStyle("-webkit-transform", "translate3d(" + coords.dx + "px, " + coords.dy + "px, " + coords.dz + "px) rotateY(0deg)");
		setTimeout(enyo.bind(this, function() {
			this.item.applyStyle("visibility", "visible");
			setTimeout(enyo.bind(this, function() {
				this.$.stage.hide();
			}), 100);
		}), 500);
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
		this.$.card.addClass("notransition");
		this.$.card.applyStyle("-webkit-transform", "rotateY(180deg) rotateX(" + (inSender.y - inSender.topBoundary) + "deg) rotateY(" + (inSender.x - inSender.leftBoundary) + "deg)");
    },
	components: [
		{kind: "Scroller", strategyKind: "TransitionScrollStrategy", classes: "enyo-fill", components: [
			{components: [
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item wide", ontap: "showCard"},
				{classes: "goodies-item tall left", ontap: "showCard"},
				{classes: "goodies-item wide", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item tall right", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item wide", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item wide", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item tall wide left", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item panorama", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"},
				{classes: "goodies-item", ontap: "showCard"}
			]}
		]},
		{name: "stage", classes: "goodies-card-stage", showing: false, onflick: "flick", onhold: "hold", ondragstart: "dragstart", ondrag: "drag", ondragfinish: "dragfinish", ontap: "hideCard", components: [
			{name: "card", classes: "goodies-card", components: [
				{classes: "goodies-card-side front", name: "front"},
				{classes: "goodies-card-side back", components: [
					{style: "width: 200px; height: 100px; text-align: center; color: #555; font-size: 25pt; box-sizing: border-box;", classes: "absolute-center", content: "Chuisy is awesome!"}
				]}
			]}
		]},
        {kind: "ScrollMath", onScrollStart: "scrollMathStart", onScroll: "scrollMathScroll", onScrollStop: "scrollMathStop",
            leftBoundary: 0, rightBoundary: 0, vertical: true, horizontal: true}
	]
});