enyo.kind({
	name: "ChuboxListItem",
	kind: "onyx.Item",
	layoutKind: "FittableColumnsLayout",
	classes: "chuboxlistitem",
	noStretch: true,
	published: {
		item: null
	},
	itemChanged: function() {
		if (this.item) {
			this.$.caption.setContent(this.item.product.name);
			this.$.productImage.applyStyle("background-image", "url(" + this.item.product.image_1 + ")");
		}
	},
	create: function() {
		this.inherited(arguments);
		this.itemChanged();
	},
	components: [
		{classes: "chuboxlistitem-image", name: "productImage"},
		{classes: "chuboxlistitem-caption ellipsis", name: "caption", fit: true}
	]
});