enyo.kind({
    name: "ResourceList",
    published: {
        resource: "",
        filters: [],
        itemsPerPage: 20
    },
    meta: {
        limit: 20,
        offset: 0,
        total_count: 0
    },
    handlers: {
        onSetupItem: "_setupItem"
    },
    create: function() {
        this.inherited(arguments);
        this.itemsPerPageChanged();
    },
    itemsPerPageChanged: function() {
        this.limit = this.itemsPerPage;
        this.$.list.setRowsPerPage(this.itemsPerPage);
    },
    load: function() {
        chuisy[this.resource].list(this.filters, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.items = response.objects;
            this.loaded();
        }), {limit: this.meta.limit});
    },
    loaded: function() {
        this.$.list.setCount(this.items.length);
        this.$.list.reset();
    },
    nextPage: function() {
        var params = {
            limit: this.meta.limit,
            offset: this.meta.offset + this.meta.limit
        };
        chuisy[this.resource].list(this.filters, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.items = this.items.concat(response.objects);
            this.refresh();
        }), params);
    },
    refresh: function() {
        this.$.list.setCount(this.chus.length);
        this.$.list.refresh();
    },
    _setupItem: function(sender, event) {
        event.isLastItem = event.index == this.items.length-1;
        if (isLastItem && !this.allPagesLoaded()) {
            this.nextPage();
        }
    },
    allPagesLoaded: function() {
        return this.meta.offset + this.meta.limit >= this.meta.total_count;
    }
});