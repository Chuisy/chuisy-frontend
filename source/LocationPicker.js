enyo.kind({
    name: "LocationPicker",
    published: {
        location: null
    },
    events: {
        onLocationChanged: ""
    },
    locationChanged: function() {
        if (this.map) {
            if (this.location) {
                latlng = new google.maps.LatLng(this.location.latitude, this.location.longitude);
                // this.map.setZoom(15);
                this.map.panTo(latlng);
                this.locationMarker.setVisible(true);
                this.locationMarker.setPosition(latlng);
                // this.$.searchInput.setValue(this.location.address);
            } else {
                this.locationMarker.setVisibile(false);
            }
        }
    },
    rendered: function() {
        this.inherited(arguments);
        // this.initialize();
    },
    initialize: function() {
        var zoom, latlng;

        if (this.location) {
            latlng = new google.maps.LatLng(this.location.latitude, this.location.longitude);
        } else {
            latlng = new google.maps.LatLng(0, 0);
        }

        var options = {
            zoom: 15,
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
        this.locationMarker = new google.maps.Marker({
            position: latlng, 
            map: this.map,
            animation: google.maps.Animation.DROP,
            draggable: true,
            visible: this.location !== null
        });        
        this.placesService = new google.maps.places.PlacesService(this.map);
        // this.autoComplete = new google.maps.places.Autocomplete(this.$.searchInput.hasNode(), {});

        google.maps.event.addListener(this.locationMarker, 'dragend', enyo.bind(this, function(event) {
            this.getLocationFromLatLng(event.latLng, enyo.bind(this, function(loc) {
                this.setLocation(loc);
                this.doLocationChanged({location: loc});
            }));
        }));
    },
    getGeolocation: function() {
        navigator.geolocation.getCurrentPosition(enyo.bind(this, function(position) {
            latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            this.getLocationFromLatLng(latlng, enyo.bind(this, function(loc) {
                this.setLocation(loc);
                this.doLocationChanged({location: loc});
            }));
        }));
    },
    getLocationFromLatLng: function(latlng, callback) {
        this.search(latlng, enyo.bind(this, function(results) {
            var loc = this.placeResultToLocation(results[0]);
            callback(loc);
        }));
    },
    placeResultToLocation: function(result) {
        return {
            name: result.name,
            address: result.formatted_address,
            latitude: result.geometry.location.Xa,
            longitude: result.geometry.location.Ya
        };
    },
    search: function(query, callback) {
        var latlng = this.location ? new google.maps.LatLng(this.location.latitude, this.location.longitude) : null;
        this.placesService.textSearch({location: latlng, radius: latlng ? 1000 : null, query: query}, enyo.bind(this, function(results, status) {
            // if (status == google.maps.places.PlacesServiceStatus.OK) {
                // for (var i = 0; i < results.length; i++) {
                //     var place = results[i];
                //     this.placeMarker(place.geometry.location);
                // }
            // }
            callback(results);
        }));
    },
    searchInputEnter: function() {
        this.search(this.$.searchInput.getValue(), enyo.bind(this, function(results) {
            var loc = this.placeResultToLocation(results[0]);
            this.setLocation(loc);
            this.doLocationChanged({location: loc});
            this.$.searchInput.setValue("");
        }));
    },
    searchInputKeyDown: function(sender, event) {
        if (event.keyCode == 13) {
            this.searchInputEnter();
        }
    },
    components: [
        {classes: "enyo-fill", name: "map"}
//        {style: "position: absolute; top: 5px; right: 5px;", components: [
//            {kind: "onyx.InputDecorator", alwaysLooksFocused: true, style: "border-radius: 20px;", components: [
//                {kind: "onyx.Input", name: "searchInput", placeholder: "Type Address...", onkeydown: "searchInputKeyDown"}
//            ]}
//        ]}
    ]
});