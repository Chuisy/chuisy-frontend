/**
    _ChuForm_ is used for selecting the price, category and filter for a chu
    after the photo has been taken
*/
enyo.kind({
    name: "ChuForm",
    classes: "chuform",
    kind: "FittableRows",
    published: {
        //* The path to the captured image
        image: "",
        price: 0
    },
    events: {
        //* Submit button has been tapped
        onDone: "",
        //* Back button has been tapped
        onBack: ""
    },
    handlers: {
        ontap: "tap"
    },
    create: function() {
        this.inherited(arguments);
        this.currencyFormat = new enyo.g11n.NumberFmt({style: "currency", fractionDigits: 0});
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
            // note: needed because show/hide changes
            // the position so sync'ing is required when
            // dragging begins (needed because show/hide does not trigger onscroll)
            this.syncScrollMath();
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
        this.setPrice(Math.max(0, Math.floor(inSender.x/10)));
    },
    scrollMathStart: function() {
        this.startAdjustPrice();
    },
    scrollMathStop: function() {
        this.finishAdjustPrice();
    },
    syncScrollMath: function() {
        var m = this.$.scrollMath;
        m.setScrollX(this.price*10);
    },
    startAdjustPrice: function() {
        if (this.finishDragTimeout) {
            clearTimeout(this.finishDragTimeout);
            this.finishDragTimeout = null;
        }
        this.addClass("adjusting-price");
        this.$.priceHint.addClass("showing");
    },
    finishAdjustPrice: function() {
        this.finishDragTimeout = setTimeout(enyo.bind(this, function() {
            this.removeClass("adjusting-price");
            this.$.priceHint.removeClass("showing");
        }), 500);
    },
    priceTapped: function() {
        this.startAdjustPrice();
        setTimeout(enyo.bind(this, function() {
            this.finishAdjustPrice();
        }), 1000);
    },
    /**
        Clear content from previous chu
    */
    clear: function() {
        // this.$.privateButton.setActive(true);
        this.setImage("");
        this.setPrice(0);
        this.$.priceHint.addClass("showing");
        this.priceChanged();
        // this.setCategory("head");
        this.$.doneButton.setDisabled(false);
    },
    imageChanged: function() {
        this.$.image.setSrc(this.image);
    },
    priceChanged: function() {
        this.$.price.setContent(this.currencyFormat.format(this.price));
    },
    getPrice: function() {
        return Math.floor(this.price);
    },
    setDoneButtonDisabled: function(disabled) {
        this.$.doneButton.setDisabled(disabled);
    },
    components: [
        // HEADER
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {kind: "Button", ontap: "doDone", classes: "header-button right primary", content: $L("next"), name: "doneButton"}
        ]},
        {classes: "chuform-image-wrapper", onflick: "flick", onhold: "hold", ondragstart: "dragstart", ondrag: "drag", ondragfinish: "dragfinish", components: [
            {kind: "Image", name: "image", classes: "chuform-image"},
            {classes: "chuform-price", name: "price", ontap: "priceTapped"},
            {classes: "chuform-price-hint", name: "priceHint", content: $L("Drag on the image to adjust the price!"), showing: false}
        ]},
        {classes: "chuform-price-hint2", content: $L("Drag on the image to adjust the price!")},
        {kind: "ScrollMath", onScrollStart: "scrollMathStart", onScroll: "scrollMathScroll", onScrollStop: "scrollMathStop",
            leftBoundary: 100000, rightBoundary: 0, vertical: false, horizontal: true, kFrictionDamping: 0.95}
    ]
});