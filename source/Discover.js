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
        onShowChu: ""
    },
    handlers: {
        onpostresize: "unfreeze"
    },
    create: function() {
        this.inherited(arguments);

        this.users = new chuisy.models.UserCollection();
        this.chus = new chuisy.models.ChuCollection();

        this.$.userList.setUsers(this.users);

        this.users.on("sync", _.bind(this.synced, this, "user"));
        this.chus.on("sync", _.bind(this.synced, this, "chu"));
        // this.chus.on("sync", _.bind(this.updateMap, this));
    },
    setupChu: function(sender, event) {
        var chu = this.chus.at(event.index);
        var image = chu.getThumbnail(600, 200) || "assets/images/chu_placeholder.png";
        this.$.resultChuImage.applyStyle("background-image", "url(" + image + ")");
        this.$.chuAvatar.setSrc(chu.get("user").profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");

        var isLastItem = event.index == this.chus.length-1;
        if (isLastItem && this.chus.hasNextPage()) {
            // Item is last item in the list but there is more! Load next page.
            this.$.chuNextPage.show();
            this.chus.fetchNext();
        } else {
            this.$.chuNextPage.hide();
        }
        return true;
    },
    chuTap: function(sender, event) {
        this.doShowChu({chu: this.chus.at(event.index)});
        event.preventDefault();
    },
    radioGroupActivate: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.resultPanels.setIndex(event.originator.index);
        }
    },
    searchInputChange: function() {
        var query = this.$.searchInput.getValue();

        if (query) {
            this.latestQuery = query;
            this.search("user", query);
            this.search("chu", query);
        } else {
            this.searchInputCancel();
        }
    },
    searchInputCancel: function() {
        this.latestQuery = null;
        this.users.reset();
        this.chus.reset();
        this.users.meta = {};
        this.chus.meta = {};
        this.synced("user", null, null, null, true);
        this.synced("chu", null, null, null, true);
        this.$.resultPanels.setIndex(0);
        this.$.resultTabs.setActive(null);
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

            if (which == "chu") {
                this.$.chuList.setCount(coll.length);
                this.$.chuList.refresh();
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
        this[which + "s"].fetch({searchQuery: query});
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
            this.locMarker = this.$.map.addMarker(this.coords, null, null, null, true);
        }));
    },
    updateMap: function(collection, response, request, force) {
        if (force || request && request.data && request.data.q == this.latestQuery) {
            this.$.map.clearMarkers();
            if(this.coords) {
                this.locMarker = this.$.map.addMarker(this.coords, null, null, null, false);
            }
            var chu;
            var chuMarker;
            var c = 0;
            for(var i = 0; i < this.chus.length; i++) {
                chu = this.chus.at(i);
                if(chu.get("location") && chu.get("location").latitude) {
                    var lat = chu.get("location").latitude;
                    var lng = chu.get("location").longitude;
                    var coords = {
                        latitude: lat,
                        longitude: lng
                    };
                    chuMarker = new ChuMarker();
                    chuMarker.setChu(chu);
                    this.$.map.addMarker(coords, chuMarker, null, chu, true);
                }
            }
            this.$.mapLoadMoreButton.setShowing(this.chus.hasNextPage());
        }
    },
    markerTapped: function(sender, event) {
        if (event.obj && event.obj instanceof chuisy.models.Chu) {
            this.doShowChu({chu: event.obj});
        }
    },
    mapLoadMore: function() {
        if (this.chus.hasNextPage()) {
            this.$.chuNextPage.show();
            this.chus.fetchNext();
        }
    },
    components: [
        // SEARCH INPUT
        {style: "padding: 5px; box-sizing: border-box;", components: [
            {kind: "SearchInput", classes: "discover-searchinput", onChange: "searchInputChange", onCancel: "searchInputCancel", style: "width: 100%;", disabled: false, changeDelay: 500}
        ]},
        // TABS FOR SWITCHING BETWEEN CHUS AND USERS
        {kind: "onyx.RadioGroup", name: "resultTabs", classes: "discover-tabs", onActivate: "radioGroupActivate", components: [
            {index: 1, name: "userTab", components: [
                {classes: "discover-tab-caption", content: "Users"},
                {classes: "discover-tab-count", name: "userCount"},
                {classes: "onyx-spinner tiny", name: "userSpinner", showing: false}
            ]},
            {index: 2, name: "chuTab", components: [
                {classes: "discover-tab-caption", content: "Chus"},
                {classes: "discover-tab-count", name: "chuCount"},
                {classes: "onyx-spinner tiny", name: "chuSpinner", showing: false}
            ]}/*,
            {index: 3, name: "mapTab", components: [
                {classes: "discover-tab-caption", content: "Nearby"}
            ]}
            */
        ]},
        // RESULTS
        {kind: "Panels", fit: true, name: "resultPanels", draggable: false, animate: false, components: [
            // PLACEHOLDER
            {classes: "discover-result-panel", components: [
                {classes: "discover-placeholder absolute-center", name: "placeholder"}
            ]},
            // USERS
            {classes: "discover-result-panel", components: [
                {kind: "UserList", classes: "enyo-fill", name: "userList", rowsPerPage: 20},
                {name: "userNoResults", classes: "discover-no-results absolute-center", content: $L("No users found.")}
            ]},
            // CHUS
            {classes: "discover-result-panel", components: [
                {kind: "List", classes: "enyo-fill", name: "chuList", onSetupItem: "setupChu", rowsPerPage: 20,
                    strategyKind: "TransitionScrollStrategy", thumb: false, components: [
                    {kind: "onyx.Item", name: "resultChu", classes: "discover-resultchu", ontap: "chuTap", components: [
                        {classes: "discover-resultchu-image", name: "resultChuImage", components: [
                            {kind: "Image", classes: "discover-resultchu-avatar", name: "chuAvatar"},
                            {classes: "category-icon discover-resultchu-category", name: "categoryIcon"}
                        ]}
                    ]},
                    {kind: "onyx.Spinner", name: "chuNextPage", classes: "loading-next-page"}
                ]},
                {name: "chuNoResults", classes: "discover-no-results absolute-center", content: $L("No Chus found.")}
            ]}/*,
            {classes: "discover-result-panel", components: [
                {kind: "onyx.Button", name: "mapLoadMoreButton", showing: false, content: "more", ontap: "mapLoadMore", classes: "discover-map-button"},
                {kind: "Map", onMarkerTapped: "markerTapped", classes: "enyo-fill", name: "map"}
            ]}
            */
        ]}
    ]
});