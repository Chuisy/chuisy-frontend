enyo.kind({
    name: "ChuboxItemForm",
    classes: "chuboxitemform",
    published: {
        image: "",
        location: null
    },
    create: function() {
        this.inherited(arguments);
        this.imageChanged();
        this.locationChanged();
        this.facebook = false;
        this.twitter = false;
        this.pinterest = false;
        this.loadCategories();
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
    scroll: function(sender, event) {
        var scrollPosition = sender.getStrategy().$.scrollMath.y;
          if (this.oldScrollPosition != scrollPosition) {
            this.applyStyle("background-position-y", (-scrollPosition/10 - 20) + "px");
          this.oldScrollPosition = scrollPosition;
          }
    },
    togglePlatform: function(sender, event) {
        var p = sender.platform;
        this[p] = !this[p];
        this.$[p + "Button"].addRemoveClass("active", this[p]);
    },
    loadCategories: function() {
        this.log("loading categories...");
        chuisy.category.list([], enyo.bind(this, function(sender, response) {
            console.log(response);
            for (var i=0; i<response.objects.length; i++) {
                this.$.categoryPicker.createComponent({
                    content: response.objects[i].name,
                    value: response.objects[i].resource_uri
                });
            }
            this.$.categoryPicker.render();
        }));
    },
    components: [
        {kind: "FittableRows", classes: "enyo-fill", components: [
            {classes: "chuboxitemform-spacer", fit: true},
            // {name: "price", classes: "chubox"},
            {classes: "chuboxitemform-content", components: [
                {kind: "onyx.Item", name: "locationText", classes: "chuboxitemform-location-text"},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.Slider"}
                ]},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.PickerDecorator", classes: "chuboxitemform-picker", components: [
                        {content: "Select a category!"},
                        {kind: "onyx.Picker", name: "categoryPicker"}
                    ]}
                ]},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.Button", name: "facebookButton", content: "f", platform: "facebook", ontap: "togglePlatform"},
                    {kind: "onyx.Button", name: "twitterButton", content: "t", platform: "twitter", ontap: "togglePlatform"},
                    {kind: "onyx.Button", name: "pinterestButton", content: "p", platform: "pinterest", ontap: "togglePlatform"},
                    {kind: "onyx.RadioGroup", style: "float: right;", components: [
                        {content: "public", active: true, value: "public"},
                        {content: "friends", value: "friends"}
                    ]}
                ]},
                {kind: "onyx.Item", style: "text-align: right", components: [
                    {kind: "onyx.Button", name: "postButton", classes: "chuboxitemform-post-button", content: "Post"}
                ]}
            ]}
        ]}
    ]
});