/**
    _PickLocation_ is a kind for selecting a nearby place based on the current location
*/
enyo.kind({
    name: "PickLocation",
    kind: "FittableRows",
    classes: "picklocation",
    events: {
        // User has picked a location
        onLocationPicked: "",
        // User has tapped the back button
        onBack: ""
    },
    /**
        Resets the place list and gets the geolocation
    */
    initialize: function() {
        this.places = [];
        this.refreshPlacesList();
        this.getGeoLocation();
    },
    /**
        Gets the geolocation, save the location and start a place lookup
    */
    getGeoLocation: function() {
        navigator.geolocation.getCurrentPosition(enyo.bind(this, function(position) {
            this.location = {latitude: position.coords.latitude, longitude: position.coords.longitude};
            if (App.isOnline()) {
                this.lookupPlaces();
            } else {
                this.doLocationPicked({location: null});
            }
        }), enyo.bind(this, function() {
            this.error("Failed to retrieve geolocation!");
            navigator.notification.alert($L("Chuisy couldn't get your current location. If you want to enjoy the full Chuisy experience" +
                " and receive perks like gifts and discounts from local retailers, go to 'Privacy > Location Services' in your" +
                " phone's settings and enable location services for Chuisy!"), function() {
                this.doLocationPicked({location: null});
            }, $L("Can't find you!"), $L("OK"));
        }));
    },
    /**
        Loads a list of nearby places from the foursquare api based on the current location
    */
    lookupPlaces: function() {
        this.$.spinner.show();
        this.$.resultText.hide();
        // this.$.resultText.setContent("Loading nearby places...");

        var fs_id = "0XVNZDCHBFFTGKP1YGHRAG3I154DOT0QGATA120CQ3KQFIYU";
        var fs_secret = "QPM5WVRLV0OEDLJK3NWV01F1OLDQVVMWS25PJJTFDLE02GOL";
        var ajax = new enyo.Ajax({url: "https://api.foursquare.com/v2/venues/search"});

        ajax.response(enyo.bind(this, this.placesLoaded));
        ajax.error(enyo.bind(this, function(sender, response) {
            this.log(response);
            this.skip();
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
        this.$.spinner.hide();

        // Only show places that are less than 500m away
        this.places = response.response.venues.filter(function(item) {
            return item.location.distance < 500;
        }).sort(function(a, b) {
            return a.location.distance - b.location.distance;
        });

        if (this.places.length) {
            this.$.resultText.hide();
        } else {
            this.$.resultText.show();
            this.$.resultText.setContent($L("No nearby places found!"));
        }

        this.refreshPlacesList();
    },
    /**
        Refresh the list of places
    */
    refreshPlacesList: function() {
        this.$.placesList.setCount(this.places.length);
        this.$.placesList.render();
    },
    setupItem: function(sender, event) {
        var place = this.places[event.index];
        this.$.place.setContent(place.name);
    },
    placeTapped: function(sender, event) {
        var place = this.places[event.index];
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
    newPlaceKeydown: function(sender, event) {
        if (event.keyCode == 13) {
            // User has pressed enter. Select custom location
            this.newPlaceEnter();
        }
    },
    newPlaceEnter: function() {
        if (this.$.newPlaceInput.getValue()) {
            this.location.place = {
                name: this.$.newPlaceInput.getValue()
            };
            this.doLocationPicked({location: this.location});
        }
        this.$.newPlaceInput.hasNode().blur();
        event.preventDefault();
    },
    /**
        Skip place picking
    */
    skip: function() {
        this.doLocationPicked({location: this.location});
    },
    components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: $L("back")}
            // {kind: "onyx.Button", ontap: "skip", classes: "done-button", content: "skip"}
        ]},
        // {kind: "Map", classes: "picklocation-map"},
        {kind: "Scroller", fit: true, components: [
            {classes: "picklocation-message", content: $L("<strong>Spotted!</strong><br>Where are you shopping?"), allowHtml: true},
            {kind: "FlyweightRepeater", name: "placesList", onSetupItem: "setupItem", classes: "picklocation-placeslist", components: [
                {kind: "onyx.Item", name: "place", ontap: "placeTapped", tapHightlight: true, classes: "picklocation-placeitem"}
            ]},
            {kind: "onyx.Spinner", classes: "picklocation-spinner"},
            {name: "resultText", classes: "picklocation-resulttext", showing: false},
            {style: "padding: 0 5px;", components: [
                {kind: "onyx.InputDecorator", components: [
                    {kind: "onyx.Input", name: "newPlaceInput", classes: "picklocation-newplace-input", placeholder: $L("Enter custom place..."), onkeydown: "newPlaceKeydown"}
                ]}
            ]}
        ]}
    ]
});