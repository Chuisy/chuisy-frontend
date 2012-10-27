enyo.kind({
    name: "Map",
    published: {
        center: {
            latitude: 0,
            longitude: 0
        },
        zoom: 19
    },
    handlers: {
        onresize: "resize",
        ondrag: "preventPropagation"
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
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            panControl: false,
            panControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            zoomControl: false,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.LARGE,
                position: google.maps.ControlPosition.LEFT_CENTER
            },
            mapTypeControl: false,
            mapTypeControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
            scaleControl: false,
            streetViewControl: false,
            overviewMapControl: false
        };

        this.map = new google.maps.Map(this.$.map.hasNode(), options);
        this.markers = [];
    },
    panToCenter: function() {
        latlng = new google.maps.LatLng(this.center.latitude, this.center.longitude);
        this.map.panTo(latlng);
    },
    resize: function() {
        google.maps.event.trigger(this.map, 'resize');
        this.panToCenter();
    },
    placeMarker: function(lat, lng, animation) {
        var latlng = new google.maps.LatLng(lat, lng);
        var marker = new google.maps.Marker({
            position: latlng,
            map: this.map,
            animation: animation
        });
        this.markers.push(marker);
        return marker;
    },
    preventPropagation: function() {
        return true;
    },
    clearMarkers: function() {
        for (var i=0; i<this.markers.length; i++) {
            this.markers[i].setMap(null);
            delete this.markers[i];
        }
        this.markers = [];
    },
    components: [
        {classes: "enyo-fill", name: "map"}
    ]
});