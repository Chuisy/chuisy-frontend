enyo.kind({
    name: "ChuForm",
    classes: "chuform",
    kind: "FittableRows",
    published: {
        image: "",
        location: null
    },
    events: {
        onSubmit: ""
    },
    clear: function() {
        this.$.visibilityPicker.setValue(true);
        this.$.categoryPicker.getClientControls()[0].setActive(true);
        this.setImage("");
        this.setLocation(null);
        this.price = 0;
        this.$.price.setContent(this.price + " €");
    },
    imageChanged: function() {
        this.$.imageContainer.applyStyle("background-image", "url(" + this.image + ")");
    },
    locationChanged: function() {
        if (this.location) {
            this.$.locationText.setContent(this.location.place.name + ", " + this.location.place.address);
        } else {
            this.$.locationText.setContent("");
        }
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
                    name: this.$.categoryPicker.getActive().value
                }
            },
            visibility: this.$.visibilityPicker.getValue() ? "private" : "public",
            share_facebook: this.facebook,
            share_twitter: this.twitter,
            share_pinterest: this.pinterest,
            location: this.location,
            friends: this.toUriList(this.$.friendsSelector.getSelectedItems()),
            localImage: this.image
        };
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
            {kind: "onyx.ToggleButton", onContent: "private", offContent: "public", name: "visibilityPicker", classes: "chuform-visibility-picker"},
            {kind: "onyx.Button", ontap: "doSubmit", classes: "done-button", content: "done", name: "doneButton"}
        ]},
        {name: "imageContainer", fit: true, classes: "chuform-imagecontainer", components: [
            {classes: "chuform-price", name: "price", content: "0 €"},
            {kind: "onyx.RadioGroup", name: "categoryPicker", classes: "chuform-category-picker", components: [
                {content: "Shoes", value: "Shoes"},
                {content: "Shirt", value: "Shirt"},
                {content: "Jacket", value: "Jacket"}
            ]}
        ]}
    ]
});