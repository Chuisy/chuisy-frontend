enyo.kind({
	name: "ChuMarker",
	classes: "chumarker",
	published: {
		chu: null
	},
	chuChanged: function() {
		this.$.marker.setSrc(this.chu.get("thumbnails")["200x200"]);
		/*
		if(this.chu.get("location")) {
			var latitude = this.chu.get("location").latitude;
			var longitude = this.chu.get("location").longitude;
			var latlng = new L.Latlng([latitude, longitude]);
		}
		*/
	},
	components: [
		{kind: "Image", name: "marker", classes: "chumarker-chu"},
		{classes: "chu-tip"}
	]
});