enyo.kind({
    name: "DiscoverChus",
    kind: "FittableRows",
    events: {
        onBack: ""
        // onShowChu: ""
    },
    handlers: {
        onflick: "flick"
    },
    create: function() {
        this.inherited(arguments);
        this.trendingChus = new chuisy.models.ChuCollection();
        this.chus = new chuisy.models.ChuCollection();
        this.currentColl = this.trendingChus;
        this.$.list.setChus(this.currentColl);
        this.$.list.setScrollerOffset(35);
        // this.chus.on("sync", _.bind(this.synced, this, "chu"));
        // this.trendingChus.on("sync", _.bind(this.synced, this, "chu"));
    },
    refresh: function(coll, response, request, force) {
        if (force || request && request.data && request.data.q == this.latestQuery) {
            this.$.spinner.hide();
            this.$.noResults.setShowing(!coll.length);
            if (coll != this.currentColl) {
                this.$.list.setChus(coll);
            }
            this.currentColl = coll;
        }
    },
    searchInputEnter: function() {
        var query = this.$.searchInput.getValue();

        if (query) {
            this.$.searchInput.blur();
            this.search(query);
        } else {
            this.searchInputCancel();
        }
    },
    search: function(query) {
        // We are waiting for the search response. Unload list and show spinner.
        this.chus.reset();
        this.refresh(this.chus, null, null, true);
        this.$.spinner.show();
        this.$.noResults.hide();
        this.latestQuery = query;
        this.chus.fetch({searchQuery: query, data: {thumbnails: ["100x100"], limit: 21}, success: enyo.bind(this, this.refresh)});
        App.sendCubeEvent("action", {
            type: "search",
            context: "chus",
            query: query
        });
    },
    searchInputCancel: function() {
        this.latestQuery = null;
        this.chus.reset();
        this.chus.meta = {};
        this.refresh(this.trendingChus, null, null, true);
    },
    loadTrending: function() {
        if (!this.trendingChus.length) {
            this.$.spinner.show();
            this.trendingChus.fetch({data: {thumbnails: ["100x100"], limit: 21}, success: enyo.bind(this, this.refresh)});
        }
    },
    activate: function() {
        this.$.list.show();
        this.resized();
        this.$.searchInput.show();
        enyo.asyncMethod(this, function() {
            this.$.searchInput.removeClass("hide");
        });
    },
    deactivate: function() {
        this.$.list.hide();
        this.$.searchInput.hide();
        this.$.searchInput.addClass("hide");
    },
    online: function() {
        this.$.noInternet.removeClass("show");
        this.$.searchInput.removeClass("disabled");
        return true;
    },
    offline: function() {
        this.$.noInternet.addClass("show");
        this.$.searchInput.addClass("disabled");
        return true;
    },
    flick: function(sender, event) {
        var self = this;
        setTimeout(function() {
            self.$.searchInput.addRemoveClass("hide", event.yVelocity < 0);
        }, 100);
    },
    components: [
        {kind: "Signals", ononline: "online", onoffline: "offline"},
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", content: $L("Discover")}
        ]},
        {classes: "alert error discover-alert", name: "noInternet", content: $L("No internet connection available!")},
        // SEARCH INPUT
        {kind: "SearchInput", classes: "discover-searchinput scrollaway", onEnter: "searchInputEnter", onCancel: "searchInputCancel",
        placeholder: $L("Search for people and stores...")},
        {kind: "Spinner", name: "spinner", showing: false, classes: "discover-spinner"},
        {name: "noResults", classes: "discover-no-results absolute-center", content: $L("No Chus found."), showing: false},
        // {kind: "List", fit: true, name: "list", onSetupItem: "setupChu", rowsPerPage: 20,
        //     strategyKind: "TransitionScrollStrategy", thumb: false, components: [
        //     {kind: "onyx.Item", name: "resultChu", classes: "discover-resultchu", ontap: "chuTap", components: [
        //         {classes: "discover-resultchu-image", name: "resultChuImage", components: [
        //             {kind: "Image", classes: "discover-resultchu-avatar", name: "chuAvatar"},
        //             {classes: "category-icon discover-resultchu-category", name: "categoryIcon"}
        //         ]}
        //     ]},
        //     {name: "nextPageSpacer", classes: "next-page-spacer"}
        // ]}
        {kind: "ChuList", fit: true, name: "list"}
    ]
});