enyo.kind({
    name: "DiscoverStores",
    kind: "FittableRows",
    events: {
        onBack: "",
        onShowStore: ""
    },
    handlers: {
        onflick: "flick"
    },
    scrollerOffset: 35,
    create: function() {
        this.inherited(arguments);
        this.trendingStores = new chuisy.models.StoreCollection();
        this.stores = new chuisy.models.StoreCollection();
        this.currentColl = this.trendingStores;
        this.$.list.getStrategy().topBoundary = -this.scrollerOffset;
        // this.stores.on("sync", _.bind(this.synced, this, "chu"));
        // this.trendingStores.on("sync", _.bind(this.synced, this, "chu"));
    },
    setupStore: function(sender, event) {
        var store = this.currentColl.at(event.index);
        this.$.storeName.setContent(store.get("name"));
        this.$.storeAddress.setContent(store.get("address"));
        var isLastItem = event.index == this.currentColl.length-1;
        var hasNextPage = this.currentColl.hasNextPage();
        // this.$.listItem.addRemoveClass("last-item", isLastItem && !hasNextPage);
        this.$.listItem.addRemoveClass("next-page", isLastItem && hasNextPage);
        if (isLastItem && hasNextPage) {
            this.nextPage();
        }
        return true;
    },
    nextPage: function() {
        this.currentColl.fetchNext({success: enyo.bind(this, this.refresh)});
    },
    storeTap: function(sender, event) {
        this.doShowStore({store: this.currentColl.at(event.index)});
        event.preventDefault();
    },
    refresh: function(coll, response, request, force) {
        if (force || request && request.data && request.data.q == this.latestQuery) {
            this.$.spinner.hide();
            this.$.noResults.setShowing(!coll.length);
            this.$.list.setCount(coll.length);
            if (this.currentColl == coll && coll.meta && coll.meta.offset) {
                this.currentColl = coll;
                this.$.list.refresh();
            } else {
                this.currentColl = coll;
                this.$.list.reset();
                this.$.list.setScrollTop(-this.scrollerOffset);
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
        this.$.spinner.show();
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
        if (!this.trendingStores.length) {
            this.$.spinner.show();
            this.trendingStores.fetch({success: enyo.bind(this, this.refresh)});
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
        this.$.searchInput.addRemoveClass("hide", event.yVelocity < 0);
    },
    components: [
        {kind: "Signals", ononline: "online", onoffline: "offline"},
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", content: $L("Stores")}
        ]},
        {classes: "alert error discover-alert", name: "noInternet", content: $L("No internet connection available!")},
        {kind: "SearchInput", classes: "discover-searchinput scrollaway", onEnter: "searchInputEnter", onCancel: "searchInputCancel", disabled: false},
        {kind: "Spinner", name: "spinner", showing: false, classes: "discover-spinner"},
        {name: "noResults", classes: "discover-no-results absolute-center", content: $L("No Stores found."), showing: false},
        {kind: "List", fit: true, name: "list", onSetupItem: "setupStore", rowsPerPage: 20,
            strategyKind: "TransitionScrollStrategy", thumb: false, preventDragPropagation: false, components: [
            {name: "listItem", classes: "list-item-wrapper", components: [
                {name: "store", ontap: "storeTap", classes: "list-item store-list-item pressable", components: [
                    {classes: "store-list-item-name", name: "storeName"},
                    {classes: "store-list-item-address", name: "storeAddress"}
                ]}
            ]}
        ]}
    ]
});