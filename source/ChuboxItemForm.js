enyo.kind({
    name: "ChuboxItemForm",
    classes: "chuboxitemform",
    published: {
        image: "assets/images/mirror-girl.jpeg",
        location: {
            place: {
                name: "Hirmer",
                address: "Kaufingerstr. 13"
            }
        }
    },
    create: function() {
        this.inherited(arguments);
        this.imageChanged();
        this.locationChanged();
    },
    imageChanged: function() {
        this.applyStyle("background-image", "url(" + this.image + ")");
    },
    locationChanged: function() {
        this.$.locationText.setContent(this.location.place.name + ", " + this.location.place.address);
    },
    scroll: function(sender, event) {
        var scrollPosition = sender.getStrategy().getScrollTop();
        this.applyStyle("background-position-y", (-scrollPosition/10 - 20) + "px");
    },
    components: [
        {kind: "Scroller", classes: "enyo-fill", onScroll: "scroll", components: [
            {classes: "chuboxitemform-spacer"},
            // {name: "price", classes: "chubox"},
            {classes: "chuboxitemform-content", components: [
                {kind: "onyx.Item", name: "locationText", classes: "chuboxitemform-location-text"},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.Slider"}
                ]},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.PickerDecorator", classes: "chuboxitemform-picker", components: [
                        {content: "Select a category!"},
                        {kind: "onyx.Picker", components: [
                            {content: "Pant"},
                            {content: "Shirt"},
                            {content: "Bag"},
                            {content: "Scarf"}
                        ]}
                    ]}
                ]},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.Button", name: "facebookButton", content: "f"},
                    {kind: "onyx.Button", name: "twitterButton", content: "t"},
                    {kind: "onyx.Button", name: "pinterestButton", content: "p"},
                    {kind: "onyx.RadioGroup", style: "float: right;", components: [
                        {content: "public", active: true},
                        {content: "friends"}
                    ]}
                ]},
                {kind: "onyx.Item", components: [
                    {kind: "onyx.Button", name: "postButton", classes: "chuboxitemform-post-button", content: "Post"}
                ]}   
            ]}
        ]}
    ]
});