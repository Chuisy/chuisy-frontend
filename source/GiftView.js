enyo.kind({
    name: "GiftView",
    classes: "giftview",
    events: {
        onBack: ""
    },
    published: {
        gift: null
    },
    giftChanged: function() {
        this.$.image.setSrc(this.gift.chu.thumbnails["300x300"]);
        this.$.value.setContent(this.gift.value + "%");
        this.addRemoveClass("redeemed", this.gift.redeemed);
    },
    redeem: function() {
        this.gift.redeemed = true;
        this.addClass("redeemed");
        this.$.panels.setIndex(1);
    },
    activate: function(gift) {
        this.$.panels.setIndexDirect(0);
        this.setGift(gift);
        enyo.Signals.send("onShowGuide", {view: "chu"});
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
                    {classes: "giftview-hint", content: "Show this screen to the person at the counter!"},
                    {kind: "onyx.Button", classes: "giftview-redeem-button", content: "Redeem", ontap: "redeem"},
                    {classes: "giftview-redeemed-text", content: "Redeemed"}
                ]}
            ]},
            {kind: "FittableRows", classes: "enyo-fill", components: [
                {classes: "header", components: [
                    {kind: "onyx.Button", ontap: "doBack", classes: "done-button", content: "done"}
                ]},
                {fit: true, classes: "giftview-content", components: [
                    {classes: "placeholder", name: "placeholder", components: [
                        {classes: "placeholder-image"},
                        {classes: "giftview-thanks", content: "Thanks! Your gift has been redeemed!"}
                    ]}
                ]}
            ]}
        ]}
    ]
});