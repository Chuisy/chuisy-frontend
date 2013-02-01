enyo.kind({
    name: "GiftView",
    classes: "giftview",
    events: {
        onBack: ""
    },
    published: {
        gift: null
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    giftChanged: function() {
        this.stopListening();
        this.listenTo(this.gift, "change", this.updateView());
    },
    updateView: function() {
        this.$.image.setSrc(this.gift.get("chu").thumbnails["300x300"]);
        this.$.value.setContent(this.gift.get("value") + "%");
        this.addRemoveClass("redeemed", this.gift.get("redeemed"));
    },
    redeem: function() {
        this.gift.save({redeemed: true});
        this.$.panels.setIndex(1);
    },
    activate: function(gift) {
        this.$.panels.setIndexDirect(0);
        this.setGift(gift);
        enyo.Signals.send("onShowGuide", {view: "gift"});
    },
    deactivate: function() {
        this.$.image.setSrc("");
    },
    components: [
        {kind: "Panels", arrangerKind: "HFlipArranger", classes: "enyo-fill", components: [
            {kind: "FittableRows", classes: "enyo-fill", components: [
                {classes: "header", components: [
                    {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"}
                ]},
                {fit: true, classes: "giftview-content", components: [
                    {kind: "Image", classes: "giftview-image", name: "image"},
                    {classes: "giftview-value", name: "value"},
                    {classes: "giftview-hint", content: $L("Show this screen to the person at the counter!")},
                    {kind: "onyx.Button", classes: "giftview-redeem-button", content: $L("Redeem"), ontap: "redeem"},
                    {classes: "giftview-redeemed-text", content: "Redeemed"}
                ]}
            ]},
            {kind: "FittableRows", classes: "enyo-fill", components: [
                {classes: "header", components: [
                    {kind: "onyx.Button", ontap: "doBack", classes: "done-button", content: $L("done")}
                ]},
                {fit: true, classes: "giftview-content", components: [
                    {classes: "placeholder", name: "placeholder", components: [
                        {classes: "placeholder-image"},
                        {classes: "giftview-thanks", content: $L("Thanks! Your gift has been redeemed.")}
                    ]}
                ]}
            ]}
        ]}
    ]
});