/**
    _ChuList_ is a lazy loading list of chus, very similar to _ChuBox_ but with the difference
    that the chus are requested from the server and fetched dynamically during scrolling.
    The _filter_ property can be used to select a certain subset of chus
*/
enyo.kind({
    name: "ChuList",
    classes: "chulist",
    published: {
        // A _chuisy.models.ChuCollection_ object
        chus: null,
        chusPerPage: 30,
        scrollerOffset: 0
    },
    events: {
        //* A chu has been selected
        onShowChu: "",
        onRefresh: ""
    },
    handlers: {
        onpostresize: "postResize"
    },
    // Estimated chu width
    chuWidth: 105,
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    chusPerPageChanged: function() {
        this.$.list.setRowsPerPage(Math.ceil(this.chusPerPage/(this.cellCount || 1)));
    },
    chusChanged: function() {
        this.stopListening();
        this.refresh();
        if (this.chus) {
            this.listenTo(this.chus, "sync", this.refresh);
        }
    },
    scrollerOffsetChanged: function() {
        this.$.list.getStrategy().topBoundary = -this.scrollerOffset;
    },
    rendered: function() {
        this.inherited(arguments);
        this.buildCells();
        this.chusChanged();
    },
    postResize: function() {
        this.buildCells();
        this.$.list.updateMetrics();
        this.refresh();
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
        this.chusPerPageChanged();
    },
    setupItem: function(sender, event) {
        for (var i=0; i<this.cellCount; i++) {
            var index = event.index * this.cellCount + i;
            var chu = this.chus.at(index);

            if (chu) {
                var image = chu.get("thumbnails") && chu.get("thumbnails")["100x100"] || chu.get("image") || "assets/images/chu_placeholder.png";
                this.$["chuImage" + i].applyStyle("background-image", "url(" + image + ")");
                this.$["chu" + i].applyStyle("visibility", "visible");
                // App.sendCubeEvent("impression", {
                //     chu: chu,
                //     context: "other"
                // });
            } else {
                this.$["chu" + i].applyStyle("visibility", "hidden");
            }
        }

        var isLastRow = this.chus.length && event.index+1 == Math.ceil(this.chus.length / this.cellCount);
        var hasNextPage = this.chus.hasNextPage();
        this.$.listClient.addRemoveClass("next-page", isLastRow && hasNextPage);
        this.$.listClient.applyStyle("margin-bottom", isLastRow ? "8px" : "0");
        if (isLastRow && hasNextPage) {
            this.nextPage();
        }

        return true;
    },
    nextPage: function() {
        this.chus.fetchNext({
            data: {
                limit: 21,
                thumbnails: ["100x100"]
            }
        });
    },
    /**
        Sets list count according to number of chus and refreshs
    */
    refresh: function() {
        var chuCount = this.chus && this.chus.length || 0;
        this.$.list.setCount(Math.ceil(chuCount / (this.cellCount || 1)));
        if (this.chus && this.chus.meta && this.chus.meta.offset) {
            this.$.list.refresh();
        } else {
            this.$.list.reset();
            this.$.list.setScrollTop(-this.scrollerOffset);
        }
        this.doRefresh();
    },
    chuTap: function(sender, event) {
        var index = event.index * this.cellCount + sender.cellIndex;
        this.doShowChu({chu: this.chus.at(index)});
        event.preventDefault();
    },
    getScrollTop: function() {
        return this.$.list.getScrollTop();
    },
    components: [
        {kind: "List", classes: "enyo-fill chulist-list", name: "list", thumb: false, onSetupItem: "setupItem",
            strategyKind: "TransitionScrollStrategy", preventDragPropagation: false, components: [
            {name: "listClient", classes: "chulist-row list-item-wrapper", attributes: {"data-next-page": $L("Wait, there's more!")}}
        ]}
    ]
});