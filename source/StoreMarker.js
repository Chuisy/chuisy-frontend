enyo.kind({
	name: "StoreMarker",
	classes: "storemarker",
	handlers: {
		// ontap: "openMarker"
	},
	published: {
		store: null
	},
	create: function() {
		this.inherited(arguments);
	},
	storeChanged: function() {
		var rand = Math.ceil(Math.random()*2);
        var coverPlaceholder = "assets/images/store_cover_placeholder_" + rand + ".jpg";

        this.$.content.applyStyle("background-image", "url(" + (this.store.get("cover_image") || coverPlaceholder) + ")");
	},
	setType: function(type) {
		var color = "#01A9DB";
		if (type == "partner") {
			this.addClass("partner");
		} else if (type == "friends") {

		} else if (type == "general") {
			this.addClass("general");
		}
	},
	setContent: function(name, address, zip_code, city) {
		var cName = (name || "") + "<br>";
		var cAddress = (address || " ") + "<br>";
		var cZip_code = (zip_code ? zip_code + ", " : " ");
		var cCity = (city || "");
		var title = cName;
		var information = cAddress +
			cZip_code + cCity;
		this.$.title.setContent(title);
		this.$.information.setContent(information);
	},
	setChuCount: function(chuCount) {
		this.$.number.setContent(chuCount);
	},
	buttonTap: function() {
		this.addClass("storemarker-button-tapped");
	},
	components: [
		{classes: "storemarker-content", name: "content", components: [
			{classes: "storemarker-content-elements", name: "text", components: [
				{classes: "storemarker-content-text", components: [
					{classes: "storemarker-content-title ellipsis", name: "title", allowHtml: true},
					{classes: "storemarker-content-information ellipsis", name: "information", allowHtml: true}
				]},
				{classes: "storemarker-content-button", kind: "onyx.Button", content: $L("go to store"), ontap: "buttonTap"}
			]}
		]},
		{classes: "storemarker-number", name: "number"}
	]
});