enyo.kind({
    name: "Goodies",
    classes: "goodies",
    create: function() {
        this.inherited(arguments);
        chuisy.cards.on("sync reset", this.refresh, this);
        this.dateFmt = new enyo.g11n.DateFmt();
    },
    /**
        Refreshes notification list with loaded items
    */
    refresh: function() {
        chuisy.cards.compress();
        this.$.repeater.setCount(chuisy.cards.length);
        this.$.placeholder.setShowing(!chuisy.cards.length);
    },
    setupItem: function(sender, event) {
        var card = chuisy.cards.at(event.index);
        var coupon = card.get("coupon");
        event.item.$.cardItemImage.applyStyle("background-image", "url(" + card.get("cover_image") + ")");
        event.item.$.cardItem.addClass(card.get("format"));
        event.item.$.cardItem.addRemoveClass("coupon", coupon);
        event.item.$.cardItem.addRemoveClass("redeemed", coupon && coupon.redeemed);
        event.item.$.cardItem.addRemoveClass("expired", coupon && new Date(coupon.valid_until) < new Date());
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
        var card = chuisy.cards.at(event.index);
        var coupon = card && card.get("coupon");
        if (!card || coupon && (coupon.redeemed || new Date(coupon.valid_until) < new Date())) {
            return;
        }
        this.item = this.$.repeater.itemAtIndex(event.index).$.cardItem;
        this.card = card;

        // Show stage
        this.$.stagePopup.show();
        this.$.stage.addClass("scrim");
        this.$.fakeMenu.hide();

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
        if (coupon) {
            var stores = [];
            for (var i=0; i<coupon.stores.length; i++) {
                var store = coupon.stores[i];
                stores.push(store.name + ", " + store.location.address + ", " + store.location.city);
            }
            var disclaimer = "<strong>" + $L("Redeemable at:") + "</strong> " + stores.join("; ");
            disclaimer += "; <strong>" + $L("Valid until:") + "</strong> " + this.dateFmt.format(new Date(coupon.valid_until));
            this.$.disclaimer.setContent(disclaimer);
        }
        this.$.back.reflow();
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
        if (!this.item) {
            return;
        }
        this.$.stage.removeClass("scrim");
        this.$.fakeMenu.show();
        this.$.fakeMenu.selectItem("goodies");

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
        coupon.redeem({complete: enyo.bind(this, function(request, status) {
            if (request.status == 200) {
                this.$.redeemSpinner.hide();
                this.$.redeemButton.setDisabled(false);
                this.card.get("coupon").redeemed = true;
                this.$.card.addClass("redeemed");
                this.item.addClass("redeemed");
            } else {
                var message = request.status == 400 && request.responseText ? $L(request.responseText) : $L('Something went wrong. Please try again later!');
                if (navigator.notification) {
                    navigator.notification.alert(message, function() {}, $L("Failed to redeem coupon"), "OK");
                } else {
                    alert(message);
                }
                this.$.redeemSpinner.hide();
                this.$.redeemButton.setDisabled(false);
            }
        })});
    },
    redeemButtonTapped: function() {
        App.confirm(
            $L("Redeem Coupon"),
            $L("Are you sure you want to redeem this coupon now? Note that you should not void coupons yourself but let it be done by someone you can claim it! A coupon can only be redeemed once!"),
            enyo.bind(this, function(choice) {
                if (choice) {
                    this.redeemCoupon();
                }
            }),
            [$L("Cancel"), $L("Redeem")]
        );


        // if (navigator.notification) {
        //     navigator.notification.confirm(
        //         $L("Are you sure you want to redeem this coupon now? Note that you should not void coupons yourself but let it be done by someone you can claim it! A coupon can only be redeemed once!"),
        //         enyo.bind(this, function(choice) {
        //             if (choice == 2) {
        //                 this.redeemCoupon();
        //             }
        //         }),
        //         $L("Redeem Coupon"), [$L("Cancel"), $L("Redeem")].join(",")
        //     );
        // } else {
        //     this.redeemCoupon();
        // }

        return true;
    },
    activate: function(card) {
        if (card) {
            chuisy.cards.unshift(card);
            this.refresh();
        }
        if (App.isSignedIn()) {
            chuisy.cards.fetch({update: true, remove: false});
        }
        enyo.Signals.send("onShowGuide", {view: "goodies"});
    },
    deactivate: function() {
        this.$.stagePopup.hide();
        this.hideCard();
    },
    components: [
        {name: "placeholder", classes: "placeholder-image"},
        {kind: "Scroller", strategyKind: "TransitionScrollStrategy", classes: "enyo-fill", components: [
            {kind: "Repeater", onSetupItem: "setupItem", style: "padding: 6px 4px;", components: [
                {name: "cardItem", classes: "goodies-item", ontap: "showCard", components: [
                    {name: "cardItemImage", classes: "goodies-item-image"},
                    {classes: "goodies-item-ribbon"},
                    {classes: "goodies-item-expired", content: $L("expired")}
                ]}
            ]}
        ]},
        {kind: "Popup", style: "width: 100%; height: 100%; top: 0; left: 0;", name: "stagePopup", floating: true, components: [
            {kind: "Menu", name: "fakeMenu", style: "position: absolute; top: 0; width: 100%;"},
            {name: "stage", classes: "goodies-card-stage", onflick: "flick", onhold: "hold", ondragstart: "dragstart", ondrag: "drag", ondragfinish: "dragfinish", ontap: "stageTapped", components: [
                {name: "card", classes: "goodies-card notransition", ontap: "cardTapped", components: [
                    {classes: "goodies-card-side front", name: "front", components: [
                        {classes: "goodies-card-ribbon"}
                    ]},
                    {kind: "FittableRows", classes: "goodies-card-side back", name: "back", components: [
                        {name: "cardContentImage", classes: "goodies-card-content-image"},
                        {classes: "goodies-card-text", fit: true, name: "cardTextWrapper", components: [
                            {kind: "FittingTextContainer", classes: "enyo-fill", name: "cardText"}
                        ]},
                        {classes: "goodies-card-redeem", components: [
                            {kind: "onyx.Button", name: "redeemButton", classes: "goodies-card-redeem-button", ontap: "redeemButtonTapped", components: [
                                {content: $L("Redeem")}
                            ]},
                            {kind: "CssSpinner", name: "redeemSpinner", classes: "absolute-center", showing: false},
                            {classes: "goodies-card-redeemed-text", name: "redeemedText", content: $L("Redeemed")}
                        ]},
                        {name: "disclaimer", classes: "goodies-card-disclaimer", allowHtml: true},
                        {}
                    ]}
                ]}
            ]}
        ]},
        {kind: "ScrollMath", onScrollStart: "scrollMathStart", onScroll: "scrollMathScroll", onScrollStop: "scrollMathStop",
            leftBoundary: 0, rightBoundary: 0, vertical: true, horizontal: true}
    ]
});