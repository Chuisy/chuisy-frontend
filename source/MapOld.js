enyo.kind({
	name: "MapOld",
	published: {
		center: {
			latitude: 51.0,
			longitude: 9.0
		},
		zoom: 10,
		mapType: "ROADMAP" /*ROADMAP, SATELLITE, HYBRID, TERRAIN */
	},
	events: {
		onMapClick: "",
		onMarkerTapped: ""
	},
	handlers: {
		onpostresize: "postResize"
	},
	rendered: function() {
		this.inherited(arguments);
		this.initialize();
	},
	centerChanged: function() {
		var latlng = new L.LatLng(this.center.latitude, this.center.longitude);
		this.map.setView(latlng, this.zoom);
	},
	zoomChanged: function() {
		this.map.setZoom(this.zoom);
	},
	mapTypeChanged: function() {
		this.map.removeLayer(this.layer);
		this.layer = new L.Google(this.mapType);
		this.map.addLayer(this.layer);
	},
	/**
		Add marker to map

		_latlng_ coordinates where the marker is placed
		_markerControl_ is an optional parameter to generate a custom icon
		_popupControl_ is an optional parameter to create a popup for the marker
	*/
	addMarker: function(coords, markerControl, popupControl, obj, animate) {
		var marker;
		var customHtmlIcon;
		var latlng = new L.LatLng(coords.latitude, coords.longitude);
		markerControl = markerControl || new Marker();
		markerControl.addRemoveClass("drop", animate);
		customHtmlIcon = L.divIcon({html: markerControl.generateHtml()});
		marker = new L.Marker(latlng, {icon: customHtmlIcon});
		marker.obj = obj;
		marker.on("click", enyo.bind(this, this.markerClick));
		this.map.addLayer(marker);
		if (popupControl) {
			marker.bindPopup(popupControl.generateHtml()).openPopup();
			this.map.on("dragstart", enyo.bind(marker, marker.closePopup));
		}
		this.markers.push(marker);
		return marker;
	},
	clearMarkers: function() {
		for(var i = 0; i < this.markers.length; i++) {
			this.map.removeLayer(this.markers[i]);
		}
		this.markers = [];
	},
	removeMarker: function(marker) {
		this.map.removeLayer(marker);
		this.markers = _.without(this.markers, marker);
	},
	markerClick: function(event) {
		this.doMarkerTapped({obj: event.target.obj});
	},
	initialize: function() {
		this.map = new L.Map(this.$.map.hasNode(), {center: new L.LatLng(this.center.latitude, this.center.longitude), zoom: this.zoom});
		this.layer = new L.Google(this.mapType);
		this.markers = [];
		this.map.addLayer(this.layer);
	},
	postResize: function() {
		this.map.invalidateSize();
	},
	components: [
		{classes: "enyo-fill", name: "map"}
	]
});