enyo.kind({
    name: "PickLocation",
    kind: "FittableRows",
    classes: "picklocation",
    events: {
        onLocationPicked: ""
    },
    rendered: function() {
        this.inherited(arguments);
        this.$.map.initialize();
    },
    getGeoLocation: function() {
        navigator.geolocation.getCurrentPosition(enyo.bind(this, function(position) {
            latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            this.location = {latitude: position.coords.latitude, longitude: position.coords.longitude};
            this.$.map.setCenter(this.location);
            this.$.map.placeMarker(this.location.latitude, this.location.longitude);
            this.lookupPlaces();
        }), enyo.bind(this, function() {
            this.error("Failed to retrieve geolocation!");
            alert("Failed to get location!");
        }));
    },
    lookupPlaces: function() {
        var fs_id = "0XVNZDCHBFFTGKP1YGHRAG3I154DOT0QGATA120CQ3KQFIYU";
        var fs_secret = "QPM5WVRLV0OEDLJK3NWV01F1OLDQVVMWS25PJJTFDLE02GOL";
        var ajax = new enyo.Ajax({url: "https://api.foursquare.com/v2/venues/search"});

        ajax.response(enyo.bind(this, this.placesLoaded));
        ajax.error(enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
        ajax.go({
            ll: this.location.latitude + "," + this.location.longitude,
            intent: "checkin",
            client_id: fs_id,
            client_secret: fs_secret,
            v: "20121024"
        });
    },
    placesLoaded: function(sender, response) {
        this.places = response.response.venues.filter(function(item) {
            return item.location.distance < 500;
        }).sort(function(a, b) {
            return a.location.distance - b.location.distance;
        });
        this.refreshPlacesList();
    },
    refreshPlacesList: function() {
        this.$.placesList.setCount(this.places.length);
        this.$.placesList.refresh();
    },
    setupItem: function(sender, event) {
        var place = this.places[event.index];
        this.$.place.setContent(place.name);
    },
    placeTapped: function(sender, event) {
        var place = this.places[event.index];
        this.log(place);
        this.location.place = {
            name: place.name,
            address: place.location.address,
            zip_code: place.location.postalCode,
            city: place.location.city,
            country: place.location.country,
            foursquare_id: place.id
        };
        this.doLocationPicked({location: this.location});
    },
    components: [
        {kind: "Map", classes: "picklocation-map"},
        {kind: "List", fit: true, name: "placesList", onSetupItem: "setupItem", components: [
            {kind: "onyx.Item", name: "place", ontap: "placeTapped", tapHightlight: true}
        ]}
    ]
});