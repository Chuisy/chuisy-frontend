enyo.kind({
	name: "GiftView",
	kind: "FittableRows",
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
	},
	activate: function(gift) {
		this.setGift(gift);
        enyo.Signals.send("onShowGuide", {view: "chu"});
	},
	deactivate: function() {
		this.$.image.setSrc("");
	},
	components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"}
        ]},
        {fit: true, classes: "giftview-content", components: [
			{kind: "Image", classes: "giftview-image", name: "image"},
			{classes: "giftview-value", name: "value"},
			{kind: "onyx.Button", classes: "giftview-redeem-button", content: "Redeem"}
		]}
	]
});