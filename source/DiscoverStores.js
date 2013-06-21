enyo.kind({
    name: "DiscoverStores",
    kind: "FittableRows",
    events: {
        onBack: "",
        onShowStore: ""
    },
    create: function() {
        this.inherited(arguments);
        this.trendingStores = new chuisy.models.StoreCollection();
        this.stores = new chuisy.models.StoreCollection();
        this.currentColl = this.trendingStores;
        // this.stores.on("sync", _.bind(this.synced, this, "chu"));
        // this.trendingStores.on("sync", _.bind(this.synced, this, "chu"));
    },
    setupStore: function(sender, event) {
        var store = this.currentColl.at(event.index);
        this.$.storeName.setContent(store.get("name"));
        this.$.storeAddress.setContent(store.get("address"));
        var isLastItem = event.index == this.currentColl.length-1;
        if (isLastItem && this.currentColl.hasNextPage()) {
            // Item is last item in the list but there is more! Load next page.
            this.$.nextPageSpacer.show();
            this.nextPage();
        } else {
            this.$.nextPageSpacer.hide();
        }
        return true;
    },
    nextPage: function() {
        this.$.spinner.addClass("rise");
        this.currentColl.fetchNext({success: enyo.bind(this, this.refresh)});
    },
    storeTap: function(sender, event) {
        this.doShowStore({store: this.currentColl.at(event.index)});
        event.preventDefault();
    },
    refresh: function(coll, response, request, force) {
        if (force || request && request.data && request.data.q == this.latestQuery) {
            this.$.spinner.removeClass("rise");
            this.$.noResults.setShowing(!coll.length);
            this.$.list.setCount(coll.length);
            if (this.currentColl == coll && coll.meta && coll.meta.offset) {
                this.currentColl = coll;
                this.$.list.refresh();
            } else {
                this.currentColl = coll;
                this.$.list.reset();
            }
        }
    },
    searchInputEnter: function() {
        var query = this.$.searchInput.getValue();

        if (query) {
            this.$.searchInput.blur();
            this.search(query);
            App.sendCubeEvent("search", {
                context: "stores",
                query: query
            });
        } else {
            this.searchInputCancel();
        }
    },
    search: function(query) {
        // We are waiting for the search response. Unload list and show spinner.
        this.stores.reset();
        this.refresh(this.stores, null, null, true);
        this.$.spinner.addClass("rise");
        this.$.noResults.hide();
        this.latestQuery = query;
        this.stores.fetch({searchQuery: query, success: enyo.bind(this, this.refresh)});
    },
    searchInputCancel: function() {
        this.latestQuery = null;
        this.stores.reset();
        this.stores.meta = {};
        this.refresh(this.trendingStores, null, null, true);
    },
    loadTrending: function() {
        this.trendingStores.fetch({success: enyo.bind(this, this.refresh)});
    },
    unfreeze: function() {
        this.$.list.updateMetrics();
        this.$.list.refresh();
    },
    activate: function() {
        this.$.list.show();
        this.resized();
    },
    deactivate: function() {
        this.$.list.hide();
    },
    components: [
        {classes: "header", components: [
            {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")},
            {classes: "header-text", content: $L("Stores")}
        ]},
        // SEARCH INPUT
        // {style: "padding: 5px; box-sizing: border-box; box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3); position: relative; z-index: 10;", components: [
            {kind: "SearchInput", classes: "discover-searchinput", onEnter: "searchInputEnter", onCancel: "searchInputCancel", disabled: false},
        // ]},
        {kind: "Spinner", name: "spinner", classes: "next-page-spinner rise"},
        {name: "noResults", classes: "discover-no-results absolute-center", content: $L("No Chus found."), showing: false},
        {kind: "List", fit: true, name: "list", onSetupItem: "setupStore", rowsPerPage: 20,
            strategyKind: "TransitionScrollStrategy", thumb: false, components: [
            {name: "store", ontap: "storeTap", classes: "list-item store-list-item", components: [
                {classes: "store-list-item-name", name: "storeName"},
                {classes: "store-list-item-address", name: "storeAddress"}
            ]},
            {name: "nextPageSpacer", classes: "next-page-spacer"}
        ]}
    ]
});