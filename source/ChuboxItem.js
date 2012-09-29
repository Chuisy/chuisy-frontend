enyo.kind({
	name: "ChuboxItem",
	classes: "chuboxitem",
	published: {
		item: null,
		owned: false
	},
	events: {
		onRemove: "",
		onCollect: ""
	},
	itemChanged: function() {
		if (this.item) {
			this.$.caption.setContent(this.item.product.name);
			this.$.productImage.applyStyle("background-image", "url(" + this.item.product.image_1 + ")");
		}
	},
	ownedChanged: function() {
		this.addRemoveClass("owned", this.owned);
	},
	create: function() {
		this.inherited(arguments);
		this.itemChanged();
	},
	remove: function(sender, event) {
		this.doRemove(event);
		return true;
	},
	collect: function(sender, event) {
		this.doCollect(event);
		return true;
	},
	components: [
		{name: "productImage", classes: "chuboxitem-image"},
		{classes: "chuboxitem-caption ellipsis", name: "caption"},
		{classes: "chuboxitem-toolbar", components: [
			{kind: "onyx.IconButton", src: "assets/images/x.png", classes: "chuboxitem-toolbar-button chuboxitem-remove-button", ontap: "remove"},
			{kind: "onyx.IconButton", src: "assets/images/chubox.png", classes: "chuboxitem-toolbar-button chuboxitem-collect-button", ontap: "collect"}
		]}
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