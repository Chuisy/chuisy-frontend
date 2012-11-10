enyo.kind({
    name: "ChuboxItemForm",
    classes: "chuboxitemform",
    published: {
        image: "",
        location: null
    },
    events: {
        onSubmit: ""
    },
    clear: function() {
        this.facebook = false;
        this.$.facebookButton.removeClass("active");
        this.twitter = false;
        this.$.twitterButton.removeClass("active");
        this.pinterest = false;
        this.$.pinterestButton.removeClass("active");
        this.visibility = "public";
        this.$.categoryPicker.getClientControls()[0].setActive(true);
        this.setImage("");
        this.setLocation(null);

//          this.$.scroller.getStrategy().$.scrollMath.kDragDamping = 0.1;
//          this.$.scroller.getStrategy().$.scrollMath.kSpringDamping = 0.2;
    },
    imageChanged: function() {
        this.applyStyle("background-image", "url(" + this.image + ")");
    },
    locationChanged: function() {
        if (this.location) {
            this.$.locationText.setContent(this.location.place.name + ", " + this.location.place.address);
        }
    },
    // scroll: function(sender, event) {
    //     var scrollPosition = sender.getStrategy().$.scrollMath.y;
    //       if (this.oldScrollPosition != scrollPosition) {
    //         this.applyStyle("background-position-y", (-scrollPosition/10 - 20) + "px");
    //       this.oldScrollPosition = scrollPosition;
    //       }
    // },
    togglePlatform: function(sender, event) {
        var p = sender.platform;
        this[p] = !this[p];
        this.$[p + "Button"].addRemoveClass("active", this[p]);
    },
    loadCategories: function() {
        chuisy.category.list([], enyo.bind(this, function(sender, response) {
            for (var i=0; i<response.objects.length; i++) {
                this.$.categoryPicker.createComponent({
                    content: response.objects[i].name,
                    value: response.objects[i].resource_uri
                });
            }
            this.$.categoryPicker.render();
        }));
    },
    loadFriends: function() {
        chuisy.followingrelation.list(['user', this.user.id], enyo.bind(this, function(sender, response) {
            var users = [];
            for (var i=0; i<response.objects.length; i++) {
                users.push(response.objects[i].followee);
            }
            this.$.friendsSelector.setItems(users);
        }));
    },
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
                price: this.getPrice(),
                category: {
                    name: this.$.categoryPicker.getActive().value
                }
            },
            visibility: this.visibility,
            share_facebook: this.facebook,
            share_twitter: this.twitter,
            share_pinterest: this.pinterest,
            location: this.location,
            friends: this.toUriList(this.$.friendsSelector.getSelectedItems())
        };
    },
    getPrice: function() {
        var price = Math.pow(this.$.priceSlider.getValue(), 1.5);
        price = Math.round(price);
        return price;
    },
    priceChange: function(sender, event) {
        var knobPosition = this.$.priceSlider.$.knob.getBounds();
        this.$.priceLabel.applyStyle("left", (knobPosition.left + 20) + "px");
        this.$.priceLabel.setContent(this.getPrice() + " €");
    },
    visibilityChanged: function(sender, event) {
        if (event.originator.getActive()) {
            var value = event.originator.value;
            this.log(value);

            this.visibility = value;

            if (value == "friends") {
                this.openSecondarySlider();
            } else {
                this.closeSecondarySlider();
            }
        }
    },
    openSecondarySlider: function() {
        this.$.slider.animateToMin();
    },
    closeSecondarySlider: function() {
        this.$.slider.animateToMax();
    },
    components: [
        {kind: "FittableRows", classes: "enyo-fill", components: [
            {classes: "chuboxitemform-spacer", fit: true},
            // {name: "price", classes: "chubox"},
            {classes: "chuboxitemform-content", components: [
                {kind: "onyx.Item", name: "locationText", classes: "chuboxitemform-location-text"},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.Slider", name: "priceSlider", onChanging: "priceChange", onChange: "priceChange"},
                    {classes: "chuboxitemform-price-label", name: "priceLabel"}
                ]},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.RadioGroup", name: "categoryPicker", components: [
                        {content: "Shoes", value: "Shoes"},
                        {content: "Shirt", value: "Shirt"},
                        {content: "Jacket", value: "Jacket"}
                    ]}
                ]},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.Button", name: "facebookButton", content: "f", platform: "facebook", ontap: "togglePlatform"},
                    {kind: "onyx.Button", name: "twitterButton", content: "t", platform: "twitter", ontap: "togglePlatform"},
                    {kind: "onyx.Button", name: "pinterestButton", content: "p", platform: "pinterest", ontap: "togglePlatform"},
                    {kind: "onyx.RadioGroup", onActivate: "visibilityChanged", style: "float: right;", components: [
                        {content: "public", active: true, value: "public"},
                        {content: "friends", value: "friends"},
                        {content: "private", value: "private"}
                    ]}
                ]},
                {kind: "onyx.Item", style: "text-align: right", components: [
                    {kind: "onyx.Button", name: "postButton", classes: "chuboxitemform-post-button", content: "Post", ontap: "doSubmit"}
                ]}
            ]}
        ]},
        {kind: "Slideable", overMoving: false, unit: "px", min: -330, max: 0, preventDragPropagation: true, classes: "secondaryslider", name: "slider", components: [
            {classes: "enyo-fill", components: [
                {kind: "PeopleSelector", name: "friendsSelector", onChange: "friendsChanged"}
            ]}
        ]}
    ]
});