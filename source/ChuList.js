enyo.kind({
    name: "ChuList",
    classes: "chulist",
    published: {
        filters: []
    },
    events: {
        onChuSelected: ""
    },
    handlers: {
        onresize: "resized"
    },
    chuWidth: 105,
    meta: {
        offset: 0,
        limit: 60
    },
    items: [],
    rendered: function() {
        this.inherited(arguments);
        this.buildCells();
        this.$.list.setRowsPerPage(Math.ceil(this.meta.limit/this.cellCount));
        this.load();
    },
    resized: function() {
        this.buildCells();
        this.refresh();
    },
    buildCells: function() {
        if (!this.hasNode()) {
            return;
        }

        this.cellCount = Math.floor(this.getBounds().width / this.chuWidth);

        this.$.listClient.destroyClientControls();
        for (var i=0; i<this.cellCount; i++) {
            this.$.listClient.createComponent({classes: "chulist-chu", cellIndex: i, ontap: "chuTap", name: "chu" + i, owner: this, components: [
                {classes: "chulist-chu-image", name: "chuImage" + i}
            ]});
        }
    },
    setupItem: function(sender, event) {
        for (var i=0; i<this.cellCount; i++) {
            var index = event.index * this.cellCount + i;
            var chu = this.items[index];

            if (chu) {
                var image = chu.thumbnails && chu.thumbnails["100x100"] ? chu.thumbnails["100x100"] : chu.image;
                this.$["chuImage" + i].applyStyle("background-image", "url(" + image + ")");
                this.$["chu" + i].applyStyle("visibility", "visible");
            } else {
                this.$["chu" + i].applyStyle("visibility", "hidden");
            }

            var isLastItem = index == this.items.length-1;
            if (isLastItem && !this.allPagesLoaded()) {
                this.$.loadingNextPage.show();
                this.nextPage();
            } else {
                this.$.loadingNextPage.hide();
            }
        }

        return true;
    },
    load: function() {
        chuisy.chu.list(this.filters, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.items = response.objects;
            this.refresh();
        }), {limit: this.meta.limit});
    },
    nextPage: function() {
        var params = {
            limit: this.meta.limit,
            offset: this.meta.offset + this.meta.limit
        };
        chuisy.chu.list(this.filters, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.items = this.items.concat(response.objects);
            this.refresh();
        }), params);
    },
    refresh: function() {
        this.$.list.setCount(Math.ceil(this.items.length / this.cellCount));
        this.$.list.refresh();
    },
    allPagesLoaded: function() {
        return this.meta.offset + this.meta.limit >= this.meta.total_count;
    },
    chuTap: function(sender, event) {
        var index = event.index * this.cellCount + sender.cellIndex;
        this.doChuSelected({chu: this.items[index]});
    },
    components: [
        {kind: "List", classes: "enyo-fill chulist-list", name: "list", onSetupItem: "setupItem", components: [
            {name: "listClient", classes: "chulist-row"},
            {name: "loadingNextPage", content: "Loading...", classes: "chulist-nextpage"}
        ]}
    ]
});