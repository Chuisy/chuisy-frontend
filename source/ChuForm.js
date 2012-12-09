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
        image: ""
    },
    events: {
        //* Submit button has been tapped
        onSubmit: "",
        //* Back button has been tapped
        onBack: ""
    },
    handlers: {
        ondrag: "drag",
        ondragstart: "dragStart",
        ondragfinish: "dragFinish",
        ontap: "tap"
    },
    price: 0,
    category: "head",
    /**
        Clear content from previous chu
    */
    clear: function() {
        this.$.privateButton.setActive(true);
        this.setImage("");
        this.price = 0;
        this.$.price.setContent(this.price + " €");
    },
    imageChanged: function() {
        this.$.imageContainer.applyStyle("background-image", "url(" + this.image + ")");
    },
    /**
        Get the selected / generated data
    */
    getData: function() {
        return {
            product: {
                price: Math.floor(this.price),
                price_currency: "EUR",
                category: {
                    name: this.category
                }
            },
            visibility: this.$.visibilityPicker.getActive().value,
            localImage: this.image
        };
    },
    dragStart: function() {
        if (this.finishDragTimeout) {
            clearTimeout(this.finishDragTimeout);
            this.finishDragTimeout = null;
        }
        this.$.price.addClass("highlighted");
    },
    dragFinish: function() {
        this.finishDragTimeout = setTimeout(enyo.bind(this, function() {
            this.$.price.removeClass("highlighted");
        }), 2000);
    },
    drag: function(sender, event) {
        this.price = Math.max(0, this.price + event.dx / 100);
        this.$.price.setContent(Math.floor(this.price) + " €");
        return true;
    },
    tap: function(sender, event) {
        if (!event.originator.isDescendantOf(this.$.categoryPicker) && this.$.categoryPicker.hasClass("open")) {
            this.closeCategoryPicker();
            return true;
        }
    },
    /**
        Toggles the category picker
    */
    toggleCategoryPicker: function() {
        if (this.$.categoryPicker.hasClass("open")) {
            this.closeCategoryPicker();
        } else {
            this.openCategoryPicker();
        }
    },
    /**
        Opens the category picker by spreading out the category icons
    */
    openCategoryPicker: function() {
        this.$.categoryPicker.addClass("open");
        var categoryIcons = this.$.categoryPicker.getClientControls();

        for (var i=0; i<categoryIcons.length; i++) {
            categoryIcons[i].applyStyle("bottom", 60*i + "px");
            categoryIcons[i].applyStyle("right", (2*i*i) + "px");
        }
    },
    /**
        Closes the category picker
    */
    closeCategoryPicker: function() {
        this.$.categoryPicker.removeClass("open");
        var categoryIcons = this.$.categoryPicker.getClientControls();

        for (var i=0; i<categoryIcons.length; i++) {
            categoryIcons[i].applyStyle("bottom", "0");
            categoryIcons[i].applyStyle("right", "0");
        }
    },
    /**
        Select a category from the category picker
    */
    selectCategory: function(sender, event) {
        this.category = sender.value;
        var categoryIcons = this.$.categoryPicker.getClientControls();
        for (var i=0; i<categoryIcons.length; i++) {
            categoryIcons[i].addRemoveClass("selected", categoryIcons[i].value == this.category);
        }
    },
    visibilityChanged: function(sender, event) {
        sender.setActive(true);
    },
    components: [
        // HEADER
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
            {kind: "Group", name: "visibilityPicker", classes: "visibility-picker", components: [
                {kind: "GroupItem", classes: "private-button", name: "privateButton", ontap: "visibilityChanged", value: "private"},
                {kind: "GroupItem", classes: "public-button", name: "publicButton", ontap: "visibilityChanged", value: "public"}
            ]},
            {kind: "onyx.Button", ontap: "doSubmit", classes: "done-button", content: "done", name: "doneButton"}
        ]},
        // IMAGE WITH CONTROLS
        {name: "imageContainer", fit: true, classes: "chuform-imagecontainer", components: [
            // PRICE
            {classes: "chuform-price", name: "price", content: "0 €"},
            //CATEGORY
            {classes: "chuform-category-picker", name: "categoryPicker", ontap: "toggleCategoryPicker", components: [
                {classes: "category-icon chuform-category-icon feet", value: "feet", ontap: "selectCategory"},
                {classes: "category-icon chuform-category-icon legs", value: "legs", ontap: "selectCategory"},
                {classes: "category-icon chuform-category-icon torso", value: "torso", ontap: "selectCategory"},
                {classes: "category-icon chuform-category-icon accessoires", value: "accessoires", ontap: "selectCategory"},
                {classes: "category-icon chuform-category-icon head selected", value: "head", ontap: "selectCategory"}
            ]}
        ]}
    ]
});