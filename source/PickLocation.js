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
    create: function() {
        this.inherited(arguments);
        this.filterString = "";
        this.placesUpdated();
        chuisy.locations.on("reset add change", this.placesUpdated, this);
    },
    /**
        Resets the place list and gets the geolocation
    */
    initialize: function() {
        this.morePlaces(false);
        this.getGeoLocation();
    },
    /**
        Gets the geolocation, save the location and start a place lookup
    */
    getGeoLocation: function() {
        App.getGeoLocation(enyo.bind(this, function(position) {
            this.coordinates = {latitude: position.coords.latitude, longitude: position.coords.longitude};
            this.placesUpdated();
            chuisy.locations.fetch(_.extend({remote: true}, this.coordinates));
        }), enyo.bind(this, function() {
            navigator.notification.alert($L("Chuisy couldn't get your current location. If you want to enjoy the full Chuisy experience" +
                " and receive perks like gifts and discounts from local retailers, go to 'Privacy > Location Services' in your" +
                " phone's settings and enable location services for Chuisy!"), function() {
                this.refreshPlacesList();
            }, $L("Can't find you!"), $L("OK"));
        }));
    },
    placesUpdated: function() {
        this.places = this.coordinates ? chuisy.locations.sortBy(function(place) {
            return place.distanceTo(this.coordinates.latitude, this.coordinates.longitude);
        }, this) : chuisy.locations.models;
        this.refreshPlacesList();
    },
    /**
        Refresh the list of places
    */
    refreshPlacesList: function() {
        this.filteredPlaces = this.places.filter(enyo.bind(this, function(place) {
            return place.get("name").search(new RegExp(this.filterString, "i")) != -1 ||
                place.get("address") && place.get("address").search(new RegExp(this.filterString, "i")) != -1;
        }));
        this.$.placesList.setCount(this.limit || this.filteredPlaces.length);
        this.$.placesList.render();
    },
    setupItem: function(sender, event) {
        var place = this.filteredPlaces[event.index];
        this.$.placeName.setContent(place.get("name"));
        this.$.placeAddress.setContent(place.get("address"));
    },
    placeTapped: function(sender, event) {
        var place = this.places[event.index];
        this.location = this.location || {};
        enyo.mixin(this.location, {
            name: place.name,
            address: place.location.address,
            zip_code: place.location.postalCode,
            city: place.location.city,
            country: place.location.cc,
            foursquare_id: place.id
        });
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
            this.location = this.location || {};
            enyo.mixin(this.location, {
                name: this.$.newPlaceInput.getValue(),
                address: "",
                zip_code: null,
                city: "",
                country: "",
                foursquare_id: ""
            });
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
    applyFilter: function() {
        this.filterString = this.$.filterInput.getValue();
        this.refreshPlacesList();
    },
    filterCancel: function() {
        this.filterString = "";
        this.refreshPlacesList();
    },
    moreButtonTapped: function() {
        this.morePlaces(true);
    },
    morePlaces: function(more) {
        this.limit = more ? 0 : 10;
        this.refreshPlacesList();
        this.$.moreButton.setShowing(!more);
        this.$.message.setShowing(!more);
        this.$.filterInput.setShowing(more);
        this.$.newPlace.setShowing(more);
        this.reflow();
        this.$.scroller.scrollToTop();
    },
    components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: $L("back")}
            // {kind: "onyx.Button", ontap: "skip", classes: "done-button", content: "skip"}
        ]},
        {kind: "SearchInput", classes: "picklocation-filter-input", placeholder: $L("Type to filter places..."), onChange: "applyFilter", name: "filterInput", onCancel: "filterCancel"},
        {kind: "Scroller", fit: true, components: [
            {classes: "picklocation-message", content: $L("Where are you shopping right now?"), allowHtml: true, name: "message"},
            {kind: "FlyweightRepeater", name: "placesList", onSetupItem: "setupItem", classes: "picklocation-placeslist", components: [
                {kind: "onyx.Item", name: "place", ontap: "placeTapped", tapHightlight: true, classes: "picklocation-place", components: [
                    {classes: "picklocation-place-text", name: "placeName"},
                    {classes: "picklocation-place-address", name: "placeAddress"}
                ]}
            ]},
            // {kind: "onyx.Spinner", classes: "picklocation-spinner"},
            {name: "resultText", classes: "picklocation-resulttext", showing: false},
            {style: "padding: 0 5px;", components: [
                {kind: "onyx.InputDecorator", classes: "picklocation-new-place-input", name: "newPlace", components: [
                    {kind: "onyx.Input", name: "newPlaceInput", placeholder: $L("Enter custom place..."), onkeydown: "newPlaceKeydown"}
                ]},
                {kind: "onyx.Button", content: $L("More places..."), ontap: "morePlaces", name: "moreButton", classes: "picklocation-more-button"}
            ]}
        ]}
    ]
});