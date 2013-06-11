enyo.kind({
    name: "StoreListView",
    kind: "FittableRows",
    published: {
        stores: null
    },
    events: {
        onBack: "",
        onShowStore: ""
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    storesChanged: function() {
        this.stopListening();
        this.refresh(null, null, null, true);
        this.listenTo(this.stores, "sync", this.refresh);
        if (!this.stores.meta.total_count) {
            this.$.nextPageSpinner.addClass("rise");
            this.stores.fetch({data: {limit: 20}, success: enyo.bind(this, function() {
                this.$.nextPageSpinner.removeClass("rise");
            })});
        }
    },
    setupStore: function(sender, event) {
        var store = this.stores.at(event.index);
        this.$.storeName.setContent(store.get("name"));
        this.$.storeAddress.setContent(store.get("address"));
        var isLastItem = event.index == this.stores.length-1;
        if (isLastItem && this.stores.hasNextPage()) {
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
        this.stores.fetchNext({data: {limit: 20}, success: enyo.bind(this, this.refresh)});
    },
    storeTap: function(sender, event) {
        this.doShowStore({store: this.stores.at(event.index)});
        event.preventDefault();
    },
    refresh: function(coll, response, request, force) {
        if (force || request && request.data && request.data.q == this.latestQuery) {
            this.$.spinner.removeClass("rise");
            this.$.list.setCount(this.stores.length);
            if (this.stores == this.stores && this.stores.meta && this.stores.meta.offset) {
                this.stores = this.stores;
                this.$.list.refresh();
            } else {
                this.stores = this.stores;
                this.$.list.reset();
            }
        }
    },
    activate: function(obj) {
        this.setStores(obj);
    },
    deactivate: function() {
    },
    unfreeze: function() {
        this.$.list.updateMetrics();
        this.$.list.refresh();
    },
    components: [
        {classes: "header", components: [
            {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")},
            {classes: "header-text", content: $L("Stores")}
        ]},
        {kind: "Spinner", name: "spinner", classes: "next-page-spinner rise"},
        {kind: "List", fit: true, name: "list", onSetupItem: "setupStore", rowsPerPage: 20,
            strategyKind: "TransitionScrollStrategy", thumb: false, components: [
            {name: "store", ontap: "storeTap", classes: "discover-store", components: [
                {classes: "discover-store-text", name: "storeName"},
                {classes: "discover-store-address", name: "storeAddress"}
            ]},
            {name: "nextPageSpacer", classes: "next-page-spacer"}
        ]}
    ]
});