enyo.kind({
	name: "ProductView",
	classes: "productview",
	events: {
		onBack: ""
	},
	published: {
		product: null
	},
	productChanged: function() {
		if (this.product) {
			this.$.productName.setContent(this.product.name);
			this.$.image1.applyStyle("background-image", "url(" + this.product.image_1 + ")");
			this.$.image2.applyStyle("background-image", "url(" + this.product.image_2 + ")");
			this.$.image2.setShowing(this.product.image_2);
			this.$.image3.applyStyle("background-image", "url(" + this.product.image_3 + ")");
			this.$.image3.setShowing(this.product.image_3);
			this.$.description.setContent(this.product.description);
		}
	},
	components: [
		{kind: "FittableColumns", classes: "page-header", components: [
			{kind: "onyx.Button", content: "Back", ontap: "doBack", classes: "back-button"},
			{name: "productName", fit: true, classes: "page-header-text ellipsis"}
		]},
		{kind: "Panels", arrangerKind: "CarouselArranger", name: "imagePanels", classes: "productview-images", components: [
			{classes: "productview-carousel-image", name: "image1"},
			{classes: "productview-carousel-image", name: "image2"},
			{classes: "productview-carousel-image", name: "image3"}
		]},
		{classes: "productview-description", name: "description"}
	]
});