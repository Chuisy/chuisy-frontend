enyo.kind({
	name: "Map",
	published: {
		center: {
			latitude: 51.0,
			longitude: 9.0
		},
		zoom: 6,
		mapType: "ROADMAP" /*ROADMAP, SATELLITE, HYBRID, TERRAIN */
	},
	events: {
		onMapClick: ""
	},
	rendered: function() {
		this.inherited(arguments);
		this.initialize();
	},
	centerChanged: function() {
		var latlng = new L.LatLng(this.center.latitude, this.center.longitude);
		this.map.setView(latlng, zoom);
	},
	zoomChanged: function() {
		this.map.setZoom(this.zoom);
	},
	mapTypeChanged: function() {
		this.map.removeLayer(this.layer);
		this.layer = new L.Google(this.mapType);
		this.map.addLayer(this.layer);
	},
	addMarker: function(latlng, control) {
		var customHtmlIcon = L.divIcon({html: control.generateHtml()});
		var marker = new L.Marker(latlng, {icon: customHtmlIcon});
		this.map.addLayer(marker);
		this.markers.push(marker);
	},
	initialize: function() {
		this.map = new L.Map(this.$.map.hasNode(), {center: new L.LatLng(this.center.latitude, this.center.longitude), zoom: this.zoom});
		this.layer = new L.Google(this.mapType);
		this.markers = [];
		this.map.addLayer(this.layer);
	},
	components: [
		{classes: "enyo-fill", name: "map"}
	]
});