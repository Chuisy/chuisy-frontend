enyo.kind({
	name: "ChuItem",
	classes: "chuitem",
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
		{name: "productImage", classes: "chuitem-image"},
		{classes: "chuitem-caption ellipsis", name: "caption"}
	]
});

enyo.kind({
	name: "MiniChuItem",
	classes: "minichuitem",
	published: {
		item: null
	},
	itemChanged: function() {
		if (this.item) {
			// this.$.caption.setContent(this.item.product.name);
			this.$.productImage.applyStyle("background-image", "url(" + this.item.product.image_1 + ")");
		}
	},
	create: function() {
		this.inherited(arguments);
		this.itemChanged();
	},
	components: [
		{name: "productImage", classes: "minichuitem-image"}
		// {classes: "minichuitem-caption ellipsis", name: "caption"}
	]
});