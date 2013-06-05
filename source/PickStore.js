/**
    _PickStore_ is a kind for selecting a nearby place based on the current location
*/
enyo.kind({
    name: "PickStore",
    // kind: "FittableRows",
    classes: "pickstore",
    events: {
        // User has picked a location
        onStorePicked: "",
        // User has tapped the back button
        onBack: ""
    },
    create: function() {
        this.inherited(arguments);
        this.filterString = "";
        this.places = [];
        this.placesUpdated();
        chuisy.venues.on("reset sync", this.placesUpdated, this);
    },
    /**
        Resets the place list and gets the geolocation
    */
    initialize: function() {
        this.$.searchInput.cancel();
        this.$.customPlace.hide();
        this.getGeoLocation();
        this.selected = null;
    },
    /**
        Gets the geolocation, save the location and start a place lookup
    */
    getGeoLocation: function() {
        App.getGeoLocation(enyo.bind(this, function(position) {
            this.coordinates = {latitude: position.coords.latitude, longitude: position.coords.longitude};
            this.placesUpdated();
            this.fetchPlaces();
        }), enyo.bind(this, function() {
            navigator.notification.alert($L("Chuisy couldn't get your current location. " +
                "If you want to properly enjoy Chuisy and receive little gifts from local retailers, " +
                "go to 'Privacy > Location Services' in your phone's settings and enable location services for Chuisy!"), function() {
                this.refreshPlacesList();
            }, $L("Can't find you!"), $L("OK"));
        }));
    },
    fetchPlaces: function() {
        this.$.spinner.show();
        this.$.noResults.hide();
        chuisy.venues.fetch(enyo.mixin({remote: true, success: enyo.bind(this, function() {
            this.$.spinner.hide();
            this.$.noResults.setShowing(!chuisy.venues.length);
        }), error: enyo.bind(this, function(error) {
            this.$.spinner.hide();
            this.$.noResults.setShowing(!chuisy.venues.length);
        })}, this.coordinates));
    },
    placesUpdated: function() {
        this.places = this.coordinates ? chuisy.venues.sortBy(function(place) {
            return place.distanceTo(this.coordinates.latitude, this.coordinates.longitude);
        }, this) : chuisy.venues.models || [];
        this.refreshPlacesList();
    },
    /**
        Refresh the list of places
    */
    refreshPlacesList: function() {
        this.filteredPlaces = this.places ? this.places.filter(enyo.bind(this, function(place) {
            if (!place.get("name")) {
                return false;
            }
            var address = place.get("location") && place.get("location").address || "";
            return place.get("name").search(new RegExp(this.filterString, "i")) != -1 ||
                address && address.search(new RegExp(this.filterString, "i")) != -1;
        })) : [];
        this.$.placesList.setCount(this.filteredPlaces.length);
        this.$.placesList.render();
        this.$.scroller.scrollToTop();
    },
    setupItem: function(sender, event) {
        var place = this.filteredPlaces[event.index];
        this.$.place.addRemoveClass("selected", place == this.selected);
        this.$.placeName.setContent(place.get("name"));
        this.$.placeAddress.setContent(place.get("location").address);
    },
    placeTapped: function(sender, event) {
        var place = this.places[event.index];
        this.selected = place;
        this.$.placesList.renderRow(event.index);
        
        this.doStorePicked({location: place, coordinates: this.coordinates});
    },
    searchInputEnter: function(sender, event) {
        // User has pressed enter. Select custom location
        if (this.filteredPlaces.length) {
            this.doStorePicked({store: this.selected});
        } else {
            this.createCustomStore();
        }
        this.$.searchInput.blur();
    },
    createCustomStore: function() {
        var storeName = this.$.searchInput.getValue();
        if (!storeName) {
            return;
        }
        var store = new chuisy.models.Venue({
            name: this.$.searchInput.getValue(),
            location: {}
        });
        this.doStorePicked({store: store, coordinates: this.coordinates});
    },
    searchInputChange: function() {
        this.filterString = this.$.searchInput.getValue();
        this.$.customPlace.setShowing(this.filterString);
        this.$.customPlaceName.setContent($L("Create \"{{ name }}\"").replace("{{ name }}", this.filterString));
        this.refreshPlacesList();

        this.selected = this.filteredPlaces.length ? this.filteredPlaces[0] : null;

        this.$.customPlace.addRemoveClass("selected", !this.selected);
        this.$.placesList.renderRow(0);
    },
    searchInputCancel: function() {
        this.filterString = "";
        this.$.customPlace.hide();
        this.refreshPlacesList();
    },
    components: [
        {classes: "pickstore-inner enyo-fill", components: [
            {classes: "header", components: [
                {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")}
                // {kind: "Button", ontap: "skip", classes: "done-button", content: "skip"}
            ]},
            {kind: "SearchInput", name: "searchInput", classes: "discover-searchinput", placeholder: $L("Search or create store..."), onEnter: "searchInputEnter", onChange: "searchInputChange", onCancel: "searchInputCancel", searchEnterButton: false},
            {kind: "Scroller", classes: "pickstore-scroller", strategyKind: "TransitionScrollStrategy", thumb: false, components: [
                // {classes: "pickstore-message", content: $L("Where are you shopping right now?"), allowHtml: true, name: "message"},
                {kind: "CssSpinner", classes: "pickstore-spinner", name: "spinner", showing: false},
                {name: "customPlace", ontap: "createCustomStore", classes: "pickstore-item", showing: false, components: [
                    {classes: "pickstore-item-title", name: "customPlaceName"},
                    {classes: "pickstore-item-description", content: "Create custom store"}
                ]},
                {kind: "FlyweightRepeater", name: "placesList", onSetupItem: "setupItem", classes: "pickstore-placeslist", components: [
                    {name: "place", ontap: "placeTapped", classes: "pickstore-item", components: [
                        {classes: "pickstore-item-title", name: "placeName"},
                        {classes: "pickstore-item-description", name: "placeAddress"}
                    ]}
                ]},
                {name: "noResults", classes: "pickstore-noresults", content: $L("No nearby places found!"), showing: false}
            ]}
        ]}
    ]
});