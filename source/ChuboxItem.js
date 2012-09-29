enyo.kind({
	name: "ChuboxItem",
	classes: "chuboxitem",
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
		{name: "productImage", classes: "chuboxitem-image"},
		{classes: "chuboxitem-caption ellipsis", name: "caption"}
	]
});

enyo.kind({
	name: "ListChuboxItem",
	kind: "onyx.Item",
	layoutKind: "FittableColumnsLayout",
	classes: "listchuboxitem",
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
		{classes: "listchuboxitem-image", name: "productImage"},
		{classes: "listchuboxitem-caption ellipsis", name: "caption", fit: true}
	]
});