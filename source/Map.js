enyo.kind({
    name: "Map",
    published: {
        center: {
            latitude: 51.0,
            longitude: 9.0
        },
        zoom: 15,
        minZoom: 6
    },
    handlers: {
        onresize: "resize",
        ondrag: "preventPropagation"
    },
    events: {
        onMarkerTap: "",
        onMapZoomChange: "",
        onMapTap: ""
    },
    statics: {
        apiLoaded: function() {
            enyo.load("$lib/gmaps", function() {
                enyo.Signals.send("onLoadMapsApi");
            });
        }
    },
    rendered: function() {
        this.inherited(arguments);
        this.markers = [];
        if (typeof(google) != "undefined") {
            this.initialize();
        }
    },
    centerChanged: function () {
        if (this.map) {
            latlng = new google.maps.LatLng(this.center.latitude, this.center.longitude);
            this.map.setCenter(latlng);
        }
    },
    initialize: function() {
        if (typeof(google) == "undefined") {
            this.warn("Can not initialize map yet. Google api is not loaded!");
            return;
        }
        latlng = new google.maps.LatLng(this.center.latitude, this.center.longitude);

        var options = {
            zoom: this.zoom,
            minZoom: this.minZoom,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };

        this.map = new google.maps.Map(this.$.map.hasNode(), options);
        google.maps.event.addListener(this.map, "zoom_changed", enyo.bind(this, function() {
            this.doMapZoomChange();
        }));
        google.maps.event.addListener(this.map, "click", enyo.bind(this, function() {
            this.doMapTap({markerControl: this.markerControl});
            this.markerControl = null;
        }));

        this.markers = [];
    },
    loadDependencies: function(callback) {
        enyo.load(["$lib/gmaps"]);
    },
    panToCenter: function() {
        latlng = new google.maps.LatLng(this.center.latitude, this.center.longitude);
        this.map.panTo(latlng);
    },
    resize: function() {
        if (this.map) {
            google.maps.event.trigger(this.map, 'resize');
            this.panToCenter();
        }
    },
    addMarker: function(coords, markerControl, popupContent, obj, animate, markerType) {
        var marker;
        var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
        var image = null;
        if (markerControl) {
            // markerControl.addRemoveClass("drop", animate);
            marker = new RichMarker({
                position: latlng,
                map: this.map,
                content: markerControl.generateHtml(),
                flat: true
            });
            google.maps.event.addListener(marker, "click", enyo.bind(this, function() {
                this.markerControl = markerControl;
                this.doMarkerTap({obj: obj, markerControl: markerControl});
            }));
        } else {
            image = "./assets/images/marker-pink96x96.png";
            marker = new google.maps.Marker({
                position: latlng,
                map: this.map,
                animation: google.maps.Animation.DROP,
                icon: new google.maps.MarkerImage(
                    image,
                    null, null, null,
                    new google.maps.Size(48, 48)
                )
            });
        }
        if (popupContent) {
            var infobox = this.addInfoBox(marker, popupContent);
            google.maps.event.addListener(marker, "click", function() {
                infobox.setVisible(!(infobox.getVisible()));
            });
            // google.maps.event.addListener(this.map, "dragstart", function() {
            //     infobox.setVisible(false);
            // });
        }
        this.markers.push(marker);
        return marker;
    },
    addInfoBox: function(marker, popupContent) {
        var boxText = new enyo.Control({
            style: "position: relative; width: 1000px; height: 0; margin-left: -500px", components: [
                {style: "width: 100%; overflow: visible; text-align: center; position: absolute; bottom: 0;",
                components: [
                    {name: "inner", classes: "tooltip-content-wrapper", style: "display: inline-block", allowHtml: true, content: popupContent},
                    {classes: "tooltip-tip"}
                ]}
            ]
        });
        var options = {
            content: boxText.generateHtml(),
            zIndex: null,
            pixelOffset: new google.maps.Size(0, -60),
            closeBoxURL: "",
            boxStyle: {
                width: 0,
                overflow: "visible"
            }
        };
        var infoBox = new InfoBox(options);
        infoBox.open(this.map, marker);
        return infoBox;
    },
    placeRichMarker: function(coords, markerControl, animate) {
        var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
        var marker = new RichMarker({
            position: latlng,
            map: this.map,
            content: markerControl.generateHtml(),
            flat: true
        });
        this.markers.push(marker);
    },
    preventPropagation: function() {
        return true;
    },
    clearMarkers: function() {
        for (var i = 0; i < this.markers.length; i++) {
            this.markers[i].setMap(null);
            delete this.markers[i];
        }
        this.markers = [];
    },
    removeMarker: function(marker) {
        marker.setMap(null);
        this.markers = _.without(this.markers, marker);
    },
    apiLoaded: function() {
        if (this.hasNode()) {
            this.initialize();
        }
    },
    components: [
        {classes: "enyo-fill map-container", name: "map", components: [
            {classes: "placeholder", name: "placeholder", components: [
                {classes: "placeholder-image"},
                {classes: "placeholder-text", content: $L("Sorry, the map could not be loaded. Please check your internet connection!")}
            ]}
        ]},
        {kind: "Signals", onLoadMapsApi: "apiLoaded"}
    ]
});

$(document).ready(function() {
    $.getScript("http://maps.googleapis.com/maps/api/js?sensor=true&callback=Map.apiLoaded");
});