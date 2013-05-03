/**
    _Discover_ is a kind for discovering chus e.g. via search
*/
enyo.kind({
    name: "Discover",
    classes: "discover",
    kind: "FittableRows",
    events: {
        // An avatar or username has been tapped
        onShowUser: "",
        // A chu has been selected
        onShowChu: "",
        onShowStore: ""
    },
    handlers: {
        onpostresize: "unfreeze"
    },
    create: function() {
        this.inherited(arguments);

        this.$.mapTab.setActive(true);

        this.users = new chuisy.models.UserCollection();
        this.chus = new chuisy.models.ChuCollection();
        this.stores = new chuisy.models.StoreCollection();
        this.nearbyStores = new chuisy.models.StoreCollection();

        this.$.userList.setUsers(this.users);

        this.users.on("sync", _.bind(this.synced, this, "user"));
        this.chus.on("sync", _.bind(this.synced, this, "chu"));
        this.stores.on("sync", _.bind(this.synced, this, "store"));
        // this.chus.on("sync", _.bind(this.updateMap, this));
        var data = {
            center: App.getGeoLocation()
        };
        this.nearbyStores.fetch({data: data, success: enyo.bind(this, this.updateLocation)});

        this.currentOpenMarker = null;
    },
    setupChu: function(sender, event) {
        var chu = this.chus.at(event.index);
        var image = chu.get("thumbnails") && chu.get("thumbnails")["300x100"] || chu.get("image") || "assets/images/chu_placeholder.png";
        this.$.resultChuImage.applyStyle("background-image", "url(" + image + ")");
        this.$.chuAvatar.setSrc(chu.get("user").profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
        var isLastItem = event.index == this.chus.length-1;
        if (isLastItem && this.chus.hasNextPage()) {
            // Item is last item in the list but there is more! Load next page.
            this.$.chuNextPageSpacer.show();
            this.chuNextPage();
        } else {
            this.$.chuNextPageSpacer.hide();
        }
        App.sendCubeEvent("impression", {
            chu: chu,
            context: "discover"
        });
        return true;
    },
    setupStore: function(sender, event) {
        var store = this.stores.at(event.index);
        this.$.storeName.setContent(store.get("name"));
        this.$.storeAddress.setContent(store.get("address"));
        var isLastItem = event.index == this.stores.length-1;
        if (isLastItem && this.stores.hasNextPage()) {
            // Item is last item in the list but there is more! Load next page.
            this.$.storeNextPageSpacer.show();
            this.storeNextPage();
        } else {
            this.$.storeNextPageSpacer.hide();
        }
        return true;
    },
    chuNextPage: function() {
        this.$.chuNextPageSpinner.addClass("rise");
        this.chus.fetchNext({success: enyo.bind(this, function() {
            this.$.chuNextPageSpinner.removeClass("rise");
        }), data: {thumbnails: ["300x100"]}});
    },
    storeNextPage: function() {
        this.$.storeNextPageSpinner.addClass("rise");
        this.stores.fetchNext({success: enyo.bind(this, function() {
            this.$.storeNextPageSpinner.removeClass("rise");
        })});
    },
    chuTap: function(sender, event) {
        this.doShowChu({chu: this.chus.at(event.index)});
        event.preventDefault();
    },
    storeTap: function(sender, event) {
        this.doShowStore({store: this.stores.at(event.index)});
        event.preventDefault();
    },
    radioGroupActivate: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.resultPanels.setIndex(event.originator.index);
        }
    },
    searchInputEnter: function() {
        var query = this.$.searchInput.getValue();

        if (query) {
            this.latestQuery = query;
            this.search("user", query);
            this.search("chu", query);
            this.search("store", query);
            this.$.searchInput.blur();
            App.sendCubeEvent("search", {
                query: query
            });
        } else {
            this.searchInputCancel();
        }
    },
    searchInputCancel: function() {
        this.latestQuery = null;
        this.users.reset();
        this.chus.reset();
        this.stores.reset();
        this.nearbyStores.reset();
        this.users.meta = {};
        this.chus.meta = {};
        this.stores.meta = {};
        this.synced("user", null, null, null, true);
        this.synced("chu", null, null, null, true);
        this.synced("store", null, null, null, true);
        // this.$.resultPanels.setIndex(0);
        // this.$.resultTabs.setActive(null);
    },
    synced: function(which, collection, response, request, force) {
        if (force || request && request.data && request.data.q == this.latestQuery) {
            var coll = this[which + "s"];
            this.$[which + "Count"].show();
            this.$[which + "Count"].setContent(coll.meta.total_count);
            this.$[which + "Spinner"].hide();
            this.$[which + "NoResults"].setShowing(!coll.length);
            if (!this.$.resultPanels.getIndex()) {
                this.$.resultPanels.setIndex(1);
            }

            if (which == "chu" || which == "store") {
                this.$[which + "List"].setCount(coll.length);
                if (coll.meta && coll.meta.offset) {
                    this.$[which + "List"].refresh();
                } else {
                    this.$[which + "List"].reset();
                }
            }
        }
    },
    /**
        Searches the _which_ for a _query_
    */
    search: function(which, query) {
        // We are waiting for the search response. Unload list and show spinner.
        this[which + "s"].reset();
        this.synced(which, null, null, null, true);
        // this.updateMap(null, null, null, true);
        this.$[which + "Spinner"].show();
        this.$[which + "Count"].hide();
        this.$[which + "NoResults"].hide();
        this.latestQuery = query;
        this[which + "s"].fetch({searchQuery: query, data: {thumbnails: ["300x100"]}});
    },
    deactivate: function() {
        this.$.searchInput.blur();
    },
    activate: function() {
        enyo.Signals.send("onShowGuide", {view: "discover"});
        // this.updateLocation();
    },
    unfreeze: function() {
        this.$.chuList.updateMetrics();
        this.$.chuList.refresh();
    },
    updateLocation: function() {
        App.getGeoLocation(enyo.bind(this, function(position) {
            if (this.locMarker) {
                this.$.map.removeMarker(this.locMarker);
            }
            this.$.map.setCenter({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
            var lat = this.$.map.getCenter().latitude;
            var lng = this.$.map.getCenter().longitude;
            this.coords = {
                latitude: lat,
                longitude: lng
            };
            this.placeStoreMarkers();
        }));
    },
    updateMap: function(collection, response, request, force) {
        if (force || request && request.data && request.data.q == this.latestQuery) {
            this.$.map.clearMarkers();
            if(this.coords) {
                this.locMarker = this.$.map.addMarker(this.coords, null, null, null, false);
            }
            this.placeStoreMarkers();
        }
    },
    markerTapped: function(sender, event) {
        if (event.markerControl && event.markerControl instanceof StoreMarker) {
            var markerControl = event.markerControl;
            if (this.currentOpenMarker) {
                this.currentOpenMarker.removeClass("expanded");
            }
            if (this.currentOpenMarker == markerControl) {
                this.currentOpenMarker = null;
            } else {
                markerControl.addClass("expanded");
                this.currentOpenMarker = markerControl;
            }
            if (markerControl.node.className.indexOf("storemarker-button-tapped") > 0) {
                markerControl.removeClass("storemarker-button-tapped");
                this.doShowStore({store: markerControl.store});
            }
        }

        if (event.obj && event.obj instanceof chuisy.models.Chu) {
            this.doShowChu({chu: event.obj});
        }
    },
    mapTapped: function(sender, event) {
        if (this.currentOpenMarker && !event.markerControl) {
            this.currentOpenMarker.removeClass("expanded");
            this.currentOpenMarker = null;
        }
    },
    mapZoomChanged: function(sender, event) {
        if (this.currentOpenMarker) {
            this.currentOpenMarker.removeClass("expanded");
            this.currentOpenMarker = null;
        }
    },
    mapLoadMore: function() {
        if (this.chus.hasNextPage()) {
            this.$.chuNextPage.show();
            this.chus.fetchNext();
        }
    },
    placeStoreMarkers: function() {
        var store = null;
        var partnerMarkers = [];
        for (var i = 0; i < this.nearbyStores.length; i++) {
            store = this.nearbyStores.at(i);
            if (store.get("location") && store.get("location").latitude) {
                var coords = {
                    latitude : store.get("location").latitude,
                    longitude : store.get("location").longitude
                };
                var storeMarker = new StoreMarker();
                var chuCount = store.get("chu_count");
                storeMarker.setContent(store.get("name"), store.get("address"), store.get("zip_code"), store.get("city"));
                storeMarker.setChuCount(chuCount);
                storeMarker.setStore(store);
                if (store.get("company")) {
                    storeMarker.setType("partner");
                    partnerMarkers.push({coords: coords, marker: storeMarker});
                } else if (this.isStoreWithFriendChus(store)){
                    storeMarker.setType("friends");
                    this.$.map.addMarker(coords, storeMarker, null, null, true);
                } else {
                    storeMarker.setType("general");
                    this.$.map.addMarker(coords, storeMarker, null, null, true);
                }
            }
        }
        for (var j = 0; j < partnerMarkers.length; j++) {
            this.$.map.addMarker(partnerMarkers[j].coords, partnerMarkers[j].marker, null, null, true);
        }
    },
    isStoreWithFriendChus: function(store) {
        return false;
    },
    components: [
        // SEARCH INPUT
        {style: "padding: 5px; box-sizing: border-box;", components: [
            {kind: "SearchInput", classes: "discover-searchinput", onEnter: "searchInputEnter", onCancel: "searchInputCancel", style: "width: 100%;", disabled: false, changeDelay: 500}
        ]},
        // TABS FOR SWITCHING BETWEEN CHUS AND USERS
        {kind: "onyx.RadioGroup", name: "resultTabs", classes: "discover-tabs", onActivate: "radioGroupActivate", components: [
            {index: 1, name: "mapTab", components: [
                {classes: "discover-tab-caption", content: $L("Map")}
            ]},
            {index: 2, name: "chuTab", components: [
                {classes: "discover-tab-caption", content: $L("Chus")},
                {classes: "discover-tab-count", name: "chuCount"},
                {classes: "onyx-spinner tiny", name: "chuSpinner", showing: false}
            ]},
            {index: 3, name: "storeTab", components: [
                {classes: "discover-tab-caption", content: $L("Stores")},
                {classes: "discover-tab-count", name: "storeCount"},
                {classes: "onyx-spinner tiny", name: "storeSpinner", showing: false}
            ]},
            {index: 4, name: "userTab", components: [
                {classes: "discover-tab-caption", content: $L("People")},
                {classes: "discover-tab-count", name: "userCount"},
                {classes: "onyx-spinner tiny", name: "userSpinner", showing: false}
            ]}
        ]},
        // RESULTS
        {kind: "Panels", fit: true, name: "resultPanels", draggable: false, animate: false, components: [
            // PLACEHOLDER
            {classes: "discover-result-panel", components: [
                {classes: "discover-placeholder absolute-center", name: "placeholder"}
            ]},
            {classes: "discover-result-panel", components: [
                {kind: "Map", classes: "enyo-fill", name: "map", onMapTap: "mapTapped", onMarkerTap: "markerTapped", onMapZoomChange: "mapZoomChanged"}
            ]},
            // CHUS
            {classes: "discover-result-panel", components: [
                {kind: "CssSpinner", name: "chuNextPageSpinner", classes: "next-page-spinner"},
                {kind: "List", classes: "enyo-fill", name: "chuList", onSetupItem: "setupChu", rowsPerPage: 20,
                    strategyKind: "TransitionScrollStrategy", thumb: false, components: [
                    {kind: "onyx.Item", name: "resultChu", classes: "discover-resultchu", ontap: "chuTap", components: [
                        {classes: "discover-resultchu-image", name: "resultChuImage", components: [
                            {kind: "Image", classes: "discover-resultchu-avatar", name: "chuAvatar"},
                            {classes: "category-icon discover-resultchu-category", name: "categoryIcon"}
                        ]}
                    ]},
                    {name: "chuNextPageSpacer", classes: "next-page-spacer"}
                ]},
                {name: "chuNoResults", classes: "discover-no-results absolute-center", content: $L("No Chus found.")}
            ]},
            // STORES
            {classes: "discover-result-panel", components: [
                {kind: "CssSpinner", name: "storeNextPageSpinner", classes: "next-page-spinner"},
                {kind: "List", classes: "enyo-fill", name: "storeList", onSetupItem: "setupStore", rowsPerPage: 20,
                    strategyKind: "TransitionScrollStrategy", thumb: false, components: [
                    {name: "store", ontap: "storeTap", classes: "discover-store", components: [
                        {classes: "discover-store-text", name: "storeName"},
                        {classes: "discover-store-address", name: "storeAddress"}
                    ]},
                    {name: "storeNextPageSpacer", classes: "next-page-spacer"}
                ]},
                {name: "storeNoResults", classes: "discover-no-results absolute-center", content: $L("No Stores found.")}
            ]},
            // USERS
            {classes: "discover-result-panel", components: [
                {kind: "UserList", classes: "enyo-fill", name: "userList", rowsPerPage: 20},
                {name: "userNoResults", classes: "discover-no-results absolute-center", content: $L("No people found.")}
            ]}
        ]}
    ]
});