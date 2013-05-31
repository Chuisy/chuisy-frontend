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
    loadStores: function(searchQuery) {
        this.$.noResults.removeClass("show");
        this.$.loading.addClass("show");
        App.getGeoLocation(enyo.bind(this, function(position) {
            this.$.panels.setIndex(0);
            this.$.map.setCenter({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });

            this.stores.fetch({
                searchQuery: searchQuery, center: position.coords.latitude + "," + position.coords.longitude,
                radius: 5000, data: {limit: 50}, success: enyo.bind(this, function() {
                this.$.loading.removeClass("show");
                this.$.map.clearMarkers();
                this.removeClass("marker-open");
                this.$.noResults.addRemoveClass("show", !this.stores.length);
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
        }), enyo.bind(this, function() {
            this.$.loading.removeClass("show");
            this.$.panels.setIndex(1);
        }));
    },
    searchInputEnter: function() {
        this.loadStores(this.$.searchInput.getValue());
        this.$.searchInput.blur();
    },
    searchInputCancel: function() {
        this.loadStores();
    },
    showLoadingScrim: function() {
        this.$.loadingScrim.show();
        enyo.asyncMethod(this, function() {
            this.$.loadingScrim.addClass("show");
        });
    },
    hideLoadingScrim: function() {
        this.$.loadingScrim.removeClass("show");
        setTimeout(enyo.bind(this, function() {
            this.$.loadingScrim.hide();
        }), 500);
    },
    components: [
        {name: "loadingScrim", classes: "loading-scrim", showing: false, components: [
            {classes: "loading-scrim-inner", components: [
                {kind: "CssSpinner", name: "loadingSpinner", classes: "loading-scrim-spinner", color: "#fff"},
                {content: $L("Loading nearby stores..."), classes: "loading-scrim-text"}
            ]}
        ]},
        {kind: "Panels", animate: false, draggable: false, classes: "enyo-fill", components: [
            {style: "position: relative", components: [
                {name: "loading", classes: "alert", content: $L("Loading nearby stores...")},
                {name: "noResults", classes: "alert error", content: $L("No stores found!")},
                {kind: "Map", classes: "enyo-fill", name: "map", onMapTap: "mapTapped", onMarkerTap: "markerTapped", onMapZoomChange: "mapZoomChanged"},
                // {classes: "storemap-searchinput-wrapper", components: [
                {kind: "SearchInput", onEnter: "searchInputEnter", onCancel: "searchInputCancel", classes: "discover-searchinput storemap-searchinput"}
                // ]}
            ]},
            {style: "position: relative", components: [
                {classes: "placeholder", name: "placeholder", components: [
                    {classes: "placeholder-image"},
                    {classes: "placeholder-text", content: $L("Sorry, the map could not be loaded. Please check your internet connection!")}
                ]}
            ]}
        ]}
    ]
});