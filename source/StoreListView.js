enyo.kind({
    name: "StoreListView",
    kind: "FittableRows",
    published: {
        stores: null,
        title: ""
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
            this.$.spinner.show();
            this.stores.fetch({data: {limit: 20}});
        }
    },
    titleChanged: function() {
        this.$.title.setContent(this.title);
    },
    setupStore: function(sender, event) {
        var store = this.stores.at(event.index);
        this.$.storeName.setContent(store.get("name"));
        this.$.storeAddress.setContent(store.get("address"));
        var isLastItem = event.index == this.stores.length-1;
        var hasNextPage = this.stores.hasNextPage();
        this.$.listItem.addRemoveClass("next-page", isLastItem && hasNextPage);
        if (isLastItem && hasNextPage) {
            this.nextPage();
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
            this.$.spinner.hide();
            this.$.list.setCount(this.stores.length);
            if (this.stores == this.stores && this.stores.meta && this.stores.meta.offset) {
                this.$.list.refresh();
            } else {
                this.$.list.reset();
            }
        }
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
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", name: "title"}
        ]},
        {kind: "Spinner", style: "position: absolute; left: 0; right: 0; top: 64px; margin: 0 auto;", showing: false},
        {kind: "List", fit: true, name: "list", onSetupItem: "setupStore", rowsPerPage: 20,
            strategyKind: "TransitionScrollStrategy", thumb: false, components: [
            {name: "listItem", classes: "list-item-wrapper", attributes: {"data-next-page": $L("Wait, there's more!")}, components: [
                {name: "store", ontap: "storeTap", classes: "list-item store-list-item pressable", components: [
                    {classes: "store-list-item-name", name: "storeName"},
                    {classes: "store-list-item-address", name: "storeAddress"}
                ]}
            ]}
        ]}
    ]
});