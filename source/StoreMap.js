enyo.kind({
    name: "StoreMap",
    classes: "storemap",
    events: {
        onShowStore: ""
    },
    create: function() {
        this.inherited(arguments);
        this.stores = new chuisy.models.StoreCollection();
        // this.placeStoreMarkers();
    },
    updateLocation: function() {
        App.getGeoLocation(enyo.bind(this, function(position) {
            this.$.map.setCenter({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
        }));
    },
    markerTapped: function(sender, event) {
        if (event.markerControl && event.markerControl instanceof StoreMarker) {
            if (event.markerControl.buttonTapped) {
                event.markerControl.buttonTapped = false;
                this.doShowStore({store: event.obj});
            } else {
                var markerControl = event.markerControl;
                if (this.currentOpenMarker && this.currentOpenMarker != markerControl) {
                    this.currentOpenMarker.removeClass("expand");
                }
                var expand = !markerControl.hasClass("expand");
                markerControl.addRemoveClass("expand", expand);
                this.addRemoveClass("marker-open", expand);
                this.currentOpenMarker = markerControl.hasClass("expand") ? markerControl : null;
            }
        }
    },
    mapTapped: function(sender, event) {
        if (this.currentOpenMarker && !event.markerControl) {
            this.currentOpenMarker.removeClass("expand");
            this.removeClass("marker-open");
            this.currentOpenMarker = null;
        }
    },
    mapZoomChanged: function(sender, event) {
        if (this.currentOpenMarker) {
            this.currentOpenMarker.removeClass("expand");
            this.removeClass("marker-open");
            this.currentOpenMarker = null;
        }
    },
    placeStoreMarkers: function() {
        this.stores.fetch({data: {limit: 100}, success: enyo.bind(this, function() {
            this.$.map.clearMarkers();
            // this.updateLocation();
            for (var i = 0; i < this.stores.length; i++) {
                store = this.stores.at(i);
                if (store.get("latitude")) {
                    var coords = {
                        latitude : store.get("latitude"),
                        longitude : store.get("longitude")
                    };
                    var storeMarker = new StoreMarker();
                    storeMarker.setStore(store);
                    this.$.map.addMarker(coords, storeMarker, null, store, true);
                }
            }
        })});
    },
    components: [
        {kind: "Map", classes: "enyo-fill", name: "map", onMapTap: "mapTapped", onMarkerTap: "markerTapped", onMapZoomChange: "mapZoomChanged"},
        {classes: "storemap-searchinput-wrapper", components: [
            {kind: "SearchInput"}
        ]}
    ]
});