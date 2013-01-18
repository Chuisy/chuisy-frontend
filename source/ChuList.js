/**
    _ChuList_ is a lazy loading list of chus, very similar to _ChuBox_ but with the difference
    that the chus are requested from the server and fetched dynamically during scrolling.
    The _filter_ property can be used to select a certain subset of chus
*/
enyo.kind({
    name: "ChuList",
    classes: "chulist",
    published: {
        //* Filters to apply to query
        filters: []
    },
    events: {
        //* A chu has been selected
        onShowChu: "",
        onFinishedLoading: ""
    },
    handlers: {
        onpostresize: "postResize"
    },
    // Estimated chu width
    chuWidth: 105,
    // Meta data for requests
    meta: {
        offset: 0,
        limit: 60
    },
    items: [],
    rendered: function() {
        this.inherited(arguments);
        this.setupList();
    },
    postResize: function() {
        this.setupList();
        this.refresh();
    },
    setupList: function() {
        this.buildCells();
        this.$.list.setRowsPerPage(Math.ceil(this.meta.limit/this.cellCount));
    },
    /**
        Dynamically build cells for List. The wider the display the more cells we need
    */
    buildCells: function() {
        if (!this.hasNode()) {
            // Can't calculate bounds yet
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
                // We are at the end of the list and there seems to be more.
                // Load next bunch of chus
                this.$.loadingNextPage.show();
                this.nextPage();
            } else {
                this.$.loadingNextPage.hide();
            }
        }

        return true;
    },
    /**
        Loads first bunch of chus
    */
    load: function() {
        chuisy.chu.list(this.filters, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.items = response.objects;
            this.refresh();
            this.doFinishedLoading({total_count: response.meta.total_count});
        }), {limit: this.meta.limit});
    },
    /**
        Gets the next page of chus and append to the existing list
    */
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
    /**
        Sets list count according to number of chus and refreshs
    */
    refresh: function() {
        this.$.list.setCount(Math.ceil(this.items.length / this.cellCount));
        this.$.list.refresh();
    },
    /**
        Checks if all chus are loaded or if there is more
    */
    allPagesLoaded: function() {
        return this.meta.offset + this.meta.limit >= this.meta.total_count;
    },
    chuTap: function(sender, event) {
        var index = event.index * this.cellCount + sender.cellIndex;
        this.doShowChu({chu: this.items[index]});
        event.preventDefault();
    },
    clear: function() {
        this.items = [];
        this.refresh();
    },
    components: [
        {kind: "List", classes: "enyo-fill chulist-list", name: "list", onSetupItem: "setupItem", components: [
            {name: "listClient", classes: "chulist-row"},
            {name: "loadingNextPage", content: $L("Loading..."), classes: "chulist-nextpage"}
        ]}
    ]
});