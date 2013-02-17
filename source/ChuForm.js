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
        price: 0,
        location: null
        // category: "head"
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
        this.setPrice(Math.max(0, inSender.x/10));
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
        this.setImage("assets/images/chu_placeholder.png");
        this.setPrice(0);
        this.$.priceHint.addClass("showing");
        this.priceChanged();
        // this.setCategory("head");
        this.$.doneButton.setDisabled(false);
    },
    imageChanged: function() {
        this.$.image.setSrc(this.image);
    },
    // categoryChanged: function() {
    //     var categoryIcons = this.$.categoryPicker.getClientControls();
    //     for (var i=0; i<categoryIcons.length; i++) {
    //         categoryIcons[i].addRemoveClass("selected", categoryIcons[i].value == this.category);
    //     }
    // },
    locationChanged: function() {
        if (this.location) {
            this.$.location.setContent(this.location.get("name") || "");
            this.currencyFormat = new enyo.g11n.NumberFmt({style: "currency", fractionDigits: 0, locale: this.location.get("country")});
            this.priceChanged();
        }
    },
    priceChanged: function() {
        this.$.price.setContent(this.currencyFormat.format(this.price));
    },
    getPrice: function() {
        return Math.floor(this.price);
    },
    // tap: function(sender, event) {
    //     if (!event.originator.isDescendantOf(this.$.categoryPicker) && this.$.categoryPicker.hasClass("open")) {
    //         this.closeCategoryPicker();
    //         return true;
    //     }
    // },
    // /**
    //     Toggles the category picker
    // */
    // toggleCategoryPicker: function() {
    //     if (this.$.categoryPicker.hasClass("open")) {
    //         this.closeCategoryPicker();
    //     } else {
    //         this.openCategoryPicker();
    //     }
    // },
    // /**
    //     Opens the category picker by spreading out the category icons
    // */
    // openCategoryPicker: function() {
    //     this.$.categoryPicker.addClass("open");
    //     var categoryIcons = this.$.categoryPicker.getClientControls();

    //     for (var i=0; i<categoryIcons.length; i++) {
    //         categoryIcons[i].applyStyle("bottom", 60*i + "px");
    //         categoryIcons[i].applyStyle("right", (2*i*i) + "px");
    //     }
    // },
    // /**
    //     Closes the category picker
    // */
    // closeCategoryPicker: function() {
    //     this.$.categoryPicker.removeClass("open");
    //     var categoryIcons = this.$.categoryPicker.getClientControls();

    //     for (var i=0; i<categoryIcons.length; i++) {
    //         categoryIcons[i].applyStyle("bottom", "0");
    //         categoryIcons[i].applyStyle("right", "0");
    //     }
    // },
    // /**
    //     Select a category from the category picker
    // */
    // selectCategory: function(sender, event) {
    //     this.setCategory(sender.value);
    // },
    // // visibilityChanged: function(sender, event) {
    // //     sender.setActive(true);
    // // },
    setDoneButtonDisabled: function(disabled) {
        this.$.doneButton.setDisabled(disabled);
    },
    components: [
        // HEADER
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: $L("back")},
            // {kind: "Group", name: "visibilityPicker", classes: "visibility-picker", components: [
            //     {kind: "GroupItem", classes: "private-button", name: "privateButton", ontap: "visibilityChanged", value: "private"},
            //     {kind: "GroupItem", classes: "public-button", name: "publicButton", ontap: "visibilityChanged", value: "public"}
            // ]},
            {kind: "onyx.Button", ontap: "doDone", classes: "done-button", content: $L("next"), name: "doneButton"}
        ]},
        {classes: "chuform-image-wrapper", onflick: "flick", onhold: "hold", ondragstart: "dragstart", ondrag: "drag", ondragfinish: "dragfinish", components: [
            {kind: "Image", name: "image", classes: "chuform-image"},
            {classes: "chuform-price", name: "price", ontap: "priceTapped"},
            {classes: "chuform-price-hint", name: "priceHint", content: $L("Drag on the image to adjust the price!")},
            {classes: "chuform-location ellipsis", name: "location", ontap: "doBack"}
        ]},
        {kind: "ScrollMath", onScrollStart: "scrollMathStart", onScroll: "scrollMathScroll", onScrollStop: "scrollMathStop",
            leftBoundary: 100000, rightBoundary: 0, vertical: false, horizontal: true, kFrictionDamping: 0.95}
        //CATEGORY
        // {classes: "chuform-category-picker", name: "categoryPicker", ontap: "toggleCategoryPicker", components: [
        //     {classes: "category-icon chuform-category-icon feet", value: "feet", ontap: "selectCategory"},
        //     {classes: "category-icon chuform-category-icon legs", value: "legs", ontap: "selectCategory"},
        //     {classes: "category-icon chuform-category-icon torso", value: "torso", ontap: "selectCategory"},
        //     {classes: "category-icon chuform-category-icon accessoires", value: "accessoires", ontap: "selectCategory"},
        //     {classes: "category-icon chuform-category-icon head selected", value: "head", ontap: "selectCategory"}
        // ]},
    ]
});