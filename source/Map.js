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
    rendered: function() {
        this.inherited(arguments);
        this.initialize();
    },
    centerChanged: function () {
        if (this.map) {
            latlng = new google.maps.LatLng(this.center.latitude, this.center.longitude);
            this.map.setCenter(latlng);
        }
    },
    initialize: function() {
        latlng = new google.maps.LatLng(this.center.latitude, this.center.longitude);

        var options = {
            zoom: this.zoom,
            minZoom: this.minZoom,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };

        this.map = new google.maps.Map(this.$.map.hasNode(), options);

        this.markers = [];
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
    addMarker: function(coords, markerControl, popupContent, obj, animate) {
        var marker;
        var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
        // var image = "./assets/images/marker-pink96x96.png";
        if (markerControl) {
            markerControl.addRemoveClass("drop", animate);
        } else {
            marker = new google.maps.Marker({
                position: latlng,
                map: this.map,
                animation: google.maps.Animation.DROP
                // icon: image
            });
        }
        if (popupContent) {
            var infobox = this.addInfoBox(marker, popupContent);
            google.maps.event.addListener(marker, "click", function() {
                infobox.setVisible(!(infobox.getVisible()));
            });
            google.maps.event.addListener(this.map, "dragstart", function() {
                infobox.setVisible(false);
            });
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
            pixelOffset: new google.maps.Size(0, -45),
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
    components: [
        {classes: "enyo-fill", name: "map"}
    ]
});