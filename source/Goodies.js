enyo.kind({
    name: "Goodies",
    classes: "goodies",
    create: function() {
        this.inherited(arguments);
        chuisy.cards.on("sync", this.refresh, this);
    },
    /**
        Refreshes notification list with loaded items
    */
    refresh: function() {
        this.$.repeater.setCount(chuisy.cards.length);
    },
    setupItem: function(sender, event) {
        var card = chuisy.cards.at(event.index);
        event.item.$.cardItem.applyStyle("background-image", "url(" + card.get("cover_image") + ")");
        event.item.$.cardItem.addClass(card.get("format"));
        return true;
    },
    getCardCoords: function(item) {
        var ib = item.getBounds();
        var cb = this.$.card.getBounds();
        var sb = this.$.stage.getBounds();
        var scale = ib.width/cb.width;
        var perspective = 1000;
        xOffset = (sb.width - ib.width)/2;
        yOffset = (sb.height - ib.height)/2;
        ap = this.getAbsolutePosition(item);

        return {
            dx: (ap.left - xOffset) / scale,
            dy: (ap.top - yOffset - this.$.scroller.getScrollTop()) / scale,
            dz: perspective * (1 - 1/scale),
            scale: scale
        };
    },
    showCard: function(sender, event) {
        this.item = sender;
        this.card = chuisy.cards.at(event.index);
        var coupon = this.card.get("coupon");

        // Show stage
        this.$.stagePopup.show();
        this.$.stage.addClass("scrim");
        
        // Adjust style card style and contents
        this.$.card.removeClass("small");
        this.$.card.removeClass("big");
        this.$.card.removeClass("tall");
        this.$.card.removeClass("wide");
        this.$.card.removeClass("panorama");
        this.$.card.addClass(this.card.get("format"));
        this.$.card.addRemoveClass("coupon", coupon);
        this.$.card.addRemoveClass("redeemed", coupon && coupon.redeemed);
        this.$.front.applyStyle("background-image", "url(" + this.card.get("cover_image") + ")");
        var contentImage = (this.card.get("content_image") || this.card.get("cover_image"));
        this.$.cardContentImage.applyStyle("background-image", "url(" + contentImage + ")");
        this.$.cardText.setContent(this.card.get("text"));

        // Calculate coordinates for transition
        var coords = this.getCardCoords(this.item);

        // Move card into position and hide item
        this.flipped = false;
        this.item.applyStyle("visibility", "hidden");
        this.$.card.addClass("notransition");
        this.$.card.applyStyle("-webkit-transform", "translate3d(" + coords.dx + "px, " + coords.dy + "px, " + coords.dz + "px) rotateY(0deg)");

        enyo.asyncMethod(this, function() {
            // Trigger animation
            this.$.card.removeClass("notransition");
            this.isAnimating = true;
            this.$.card.applyStyle("-webkit-transform", "translate3d(0, 0, 0) rotateY(180deg)");
            if (this.animationTimeout) {
                clearTimeout(this.animationTimeout);
            }
            this.animationTimeout = setTimeout(enyo.bind(this, function() {
                this.$.card.addClass("notransition");
                this.$.card.addClass("elastic");
                this.isAnimating = false;
            }), 500);
        });
    },
    stageTapped: function(sender, event) {
        if (!event.originator.isDescendantOf(this.$.card)) {
            this.hideCard();
        }
    },
    hideCard: function() {
        this.$.stage.removeClass("scrim");

        var coords = this.getCardCoords(this.item);

        this.$.card.removeClass("elastic");
        this.$.card.removeClass("notransition");
        this.isAnimating = true;
        this.$.card.applyStyle("-webkit-transform", "translate3d(" + coords.dx + "px, " + coords.dy + "px, " + coords.dz + "px) rotateY(0deg)");
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
        this.animationTimeout = setTimeout(enyo.bind(this, function() {
            this.item.applyStyle("visibility", "visible");
            setTimeout(enyo.bind(this, function() {
                this.$.stagePopup.hide();
                this.$.card.addClass("notransition");
                this.isAnimating = false;
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
        if (!this.isAnimating) {
            var rotOffset = this.flipped ? 0 : 180;
            var rotFactor = 0.3;
            var rotX = -rotFactor * (inSender.y - inSender.topBoundary);
            var rotY = rotFactor * (inSender.x - inSender.leftBoundary) + rotOffset;
            this.$.card.applyStyle("-webkit-transform", "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)");
        }
    },
    cardTapped: function(sender, event) {
        this.flipCard();
        return true;
    },
    flipCard: function() {
        this.flipped = !this.flipped;
        var rotOffset = this.flipped ? 0 : 180;
        this.$.card.removeClass("notransition");
        this.isAnimating = true;
        this.$.card.applyStyle("-webkit-transform", "rotateY(" + rotOffset + "deg)");
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
        this.animationTimeout = setTimeout(enyo.bind(this, function() {
            this.$.card.addClass("notransition");
            this.isAnimating = false;
        }), 500);
    },
    getAbsolutePosition: function(con) {
        var elem = con.hasNode();
        var offsetLeft = 0;
        var offsetTop = 0;

        do {
            if (!isNaN(elem.offsetLeft)) {
                offsetLeft += elem.offsetLeft;
                offsetTop += elem.offsetTop;
            }
        } while (elem = elem.offsetParent);

        return {
            left: offsetLeft,
            top: offsetTop
        };
    },
    redeemCoupon: function() {
        this.$.redeemButton.setDisabled(true);
        this.$.redeemSpinner.show();

        var coupon = new chuisy.models.Coupon(this.card.get("coupon"));
        coupon.redeem({success: enyo.bind(this, function() {
            this.$.redeemSpinner.hide();
            this.$.redeemButton.setDisabled(false);
            this.card.get("coupon").redeemed = true;
            this.$.card.addClass("redeemed");
        })});

        return true;
    },
    activate: function() {},
    deactivate: function() {
    },
    components: [
        {kind: "Scroller", strategyKind: "TransitionScrollStrategy", classes: "enyo-fill", components: [
            {kind: "Repeater", onSetupItem: "setupItem", style: "padding: 6px 4px;", components: [
                {name: "cardItem", classes: "goodies-item", ontap: "showCard"}
            ]}
        ]},
        {kind: "Popup", style: "width: 100%; height: 100%; top: 0; left: 0;", name: "stagePopup", floating: true, components: [
            {name: "stage", classes: "goodies-card-stage", onflick: "flick", onhold: "hold", ondragstart: "dragstart", ondrag: "drag", ondragfinish: "dragfinish", ontap: "stageTapped", components: [
                {name: "card", classes: "goodies-card notransition", ontap: "cardTapped", components: [
                    {classes: "goodies-card-side front", name: "front"},
                    {classes: "goodies-card-side back", name: "back", components: [
                        {name: "cardContentImage", classes: "goodies-card-content-image"},
                        {classes: "goodies-card-text", name: "cardTextWrapper", components: [
                            {kind: "FittingTextContainer", classes: "enyo-fill", name: "cardText"}
                        ]},
                        {classes: "goodies-card-redeem", components: [
                            {kind: "onyx.Button", name: "redeemButton", classes: "goodies-card-redeem-button", ontap: "redeemCoupon", components: [
                                {content: $L("Redeem")}
                            ]},
                            {kind: "onyx.Spinner", name: "redeemSpinner", classes: "absolute-center", showing: false},
                            {classes: "goodies-card-redeemed-text", name: "redeemedText", content: $L("Redeemed")}
                        ]}
                    ]}
                ]}
            ]}
        ]},
        {kind: "ScrollMath", onScrollStart: "scrollMathStart", onScroll: "scrollMathScroll", onScrollStop: "scrollMathStop",
            leftBoundary: 0, rightBoundary: 0, vertical: true, horizontal: true}
    ]
});