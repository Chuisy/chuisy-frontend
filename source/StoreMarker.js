enyo.kind({
	name: "StoreMarker",
	classes: "storemarker",
	published: {
		store: null
	},
	storeChanged: function() {
		var rand = Math.ceil(Math.random()*2);
        var coverPlaceholder = "assets/images/store_cover_placeholder_" + rand + ".jpg";

        this.$.popup.applyStyle("background-image", "url(" + (this.store.get("cover_image") || coverPlaceholder) + ")");
		this.$.marker.setContent(this.store.get("chu_count"));
		this.$.storeName.setContent(this.store.get("name"));
		var addressString = "";
		if (this.store.get("address")) {
			addressString += this.store.get("address") + "<br>";
		}
		if (this.store.get("zip_code")) {
			addressString += this.store.get("zip_code") + " ";
		}
		addressString += this.store.get("city") || "";
		this.$.address.setContent(addressString);
		this.addRemoveClass("partner", this.store.get("company"));
	},
	buttonMouseDown: function() {
		this.buttonTapped = true;
	},
	components: [
		{classes: "storemarker-marker", name: "marker"},
		{classes: "storemarker-popup", name: "popup", components: [
			{name: "storeName", classes: "storemarker-store-name ellipsis"},
			{name: "address", classes: "storemarker-store-address", allowHtml: true},
			{classes: "storemarker-open-button", onmousedown: "buttonMouseDown"}
		]}
	]
});