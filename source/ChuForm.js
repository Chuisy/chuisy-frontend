enyo.kind({
    name: "ChuForm",
    classes: "chuform",
    kind: "FittableRows",
    published: {
        image: ""
    },
    events: {
        onSubmit: "",
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
    clear: function() {
        this.$.visibilityPicker.setValue(true);
        this.setImage("");
        this.price = 0;
        this.$.price.setContent(this.price + " €");
    },
    imageChanged: function() {
        this.$.imageContainer.applyStyle("background-image", "url(" + this.image + ")");
    },
    // scroll: function(sender, event) {
    //     var scrollPosition = sender.getStrategy().$.scrollMath.y;
    //       if (this.oldScrollPosition != scrollPosition) {
    //         this.applyStyle("background-position-y", (-scrollPosition/10 - 20) + "px");
    //       this.oldScrollPosition = scrollPosition;
    //       }
    // },
    toUriList: function(list) {
        var temp = [];
        for (var i=0; i<list.length; i++) {
            temp.push(list[i].resource_uri);
        }
        return temp;
    },
    getData: function() {
        return {
            product: {
                price: this.price,
                price_currency: "EUR",
                category: {
                    name: this.category
                }
            },
            visibility: this.$.visibilityPicker.getValue() ? "private" : "public",
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
            // this.log("dismiss!");
            return true;
        }
    },
    toggleCategoryPicker: function() {
        if (this.$.categoryPicker.hasClass("open")) {
            this.closeCategoryPicker();
        } else {
            this.openCategoryPicker();
        }
    },
    openCategoryPicker: function() {
        this.$.categoryPicker.addClass("open");
        var categoryIcons = this.$.categoryPicker.getClientControls();

        for (var i=0; i<categoryIcons.length; i++) {
            categoryIcons[i].applyStyle("bottom", 60*i + "px");
            categoryIcons[i].applyStyle("right", (2*i*i) + "px");
        }
    },
    closeCategoryPicker: function() {
        this.$.categoryPicker.removeClass("open");
        var categoryIcons = this.$.categoryPicker.getClientControls();

        for (var i=0; i<categoryIcons.length; i++) {
            categoryIcons[i].applyStyle("bottom", "0");
            categoryIcons[i].applyStyle("right", "0");
        }
    },
    selectCategory: function(sender, event) {
        this.category = sender.value;
        var categoryIcons = this.$.categoryPicker.getClientControls();
        for (var i=0; i<categoryIcons.length; i++) {
            categoryIcons[i].addRemoveClass("selected", categoryIcons[i].value == this.category);
        }
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
            {kind: "onyx.ToggleButton", onContent: "private", offContent: "public", name: "visibilityPicker", classes: "chuform-visibility-picker"},
            {kind: "onyx.Button", ontap: "doSubmit", classes: "done-button", content: "done", name: "doneButton"}
        ]},
        {name: "imageContainer", fit: true, classes: "chuform-imagecontainer", components: [
            {classes: "chuform-price", name: "price", content: "0 €"},
            {classes: "chuform-category-picker", name: "categoryPicker", ontap: "toggleCategoryPicker", components: [
                {classes: "chuform-category-icon head selected", value: "head", ontap: "selectCategory"},
                {classes: "chuform-category-icon accessoires", value: "accessoires", ontap: "selectCategory"},
                {classes: "chuform-category-icon torso", value: "torso", ontap: "selectCategory"},
                {classes: "chuform-category-icon legs", value: "legs", ontap: "selectCategory"},
                {classes: "chuform-category-icon feet", value: "feet", ontap: "selectCategory"}
            ]}
        ]}
    ]
});