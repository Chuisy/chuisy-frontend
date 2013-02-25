enyo.kind({
    name: "Gifts",
    classes: "gifts",
    events: {
        onShowGift: ""
    },
    handlers: {
        onpostresize: "unfreeze"
    },
    create: function() {
        this.inherited(arguments);
        chuisy.gifts.on("sync", this.refresh, this);
    },
    /**
        Refreshes gifts list with loaded items
    */
    refresh: function() {
        this.$.list.setCount(chuisy.gifts.length);
        this.$.list.refresh();
        this.$.placeholder.setShowing(!chuisy.gifts.length);
    },
    setupItem: function(sender, event) {
        var gift = chuisy.gifts.at(event.index);

        this.$.image.setSrc(gift.get("chu").thumbnails['100x100']);
        this.$.value.setContent(gift.get("value") + "%");
        this.$.text.setContent($L("on this product you were just admiring."));

        var isLastItem = event.index == chuisy.gifts.length-1;
        if (isLastItem && chuisy.gifts.hasNextPage()) {
            // Last item in the list and there is more! Load next page
            this.$.loadingNextPage.show();
            chuisy.gifts.fetchNext();
        } else {
            this.$.loadingNextPage.hide();
        }

        return true;
    },
    giftTapped: function(sender, event) {
        this.doShowGift({gift: chuisy.gifts.at(event.index)});
        event.preventDefault();
    },
    activate: function() {
        enyo.Signals.send("onShowGuide", {view: "gifts"});
    },
    deactivate: function() {},
    unfreeze: function() {
        this.$.list.updateMetrics();
        this.$.list.refresh();
    },
    components: [
        {classes: "placeholder", name: "placeholder", components: [
            {classes: "placeholder-image"},
            {classes: "placeholder-text", content: $L("If you go shopping with Chuisy you will soon get various little goodies and discounts here.")}
        ]},
        {kind: "List", classes: "enyo-fill", onSetupItem: "setupItem", ontap: "giftTapped", components: [
            {classes: "gifts-gift", components: [
                {kind: "Image", classes: "gifts-gift-image", name: "image"},
                {classes: "gifts-gift-value", name: "value"},
                {classes: "gifts-gift-text", name: "text"}
            ]},
            {kind: "onyx.Spinner", name: "loadingNextPage", classes: "loading-next-page"}
        ]}
    ]
});