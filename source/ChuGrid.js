enyo.kind({
    name: "ChuGrid",
    classes: "chugrid",
    published: {
        filters: [],
        count: 0,
        pageIndex: 0
    },
    events: {
        onChuSelected: ""
    },
    handlers: {
        onresize: "countChanged"
    },
    rowCount: 0,
    colCount: 0,
    pageCount: 0,
    chusPerPage: 0,
    pages: {},
    rendered: function() {
        this.inherited(arguments);
        this.countChanged();
    },
    countChanged: function() {
        this.calculateGrid();
        this.$.thumbs.setCount(this.pageCount);
        this.buildPages();
        this.reset();
    },
    pageIndexChanged: function() {
        this.$.thumbs.setIndex(this.pageIndex);
        this.$.carousel.setIndex(this.pageIndex);
        this.loadPage(this.pageIndex);
        if (this.pageIndex > 0) {
            this.loadPage(this.pageIndex-1);
        }
        if (this.pageIndex < this.pageCount-1) {
            this.loadPage(this.pageIndex+1);
        }
    },
    calculateGrid: function() {
        this.colCount = this.hasNode() ? Math.floor(this.getBounds().width / 100) : 0;
        this.rowCount = this.hasNode() ? Math.floor(this.getBounds().height / 100) : 0;
        this.chusPerPage = this.colCount * this.rowCount;
        this.pageCount = this.chusPerPage ? Math.ceil(this.count / this.chusPerPage) : 0;
    },
    loadPage: function(pageIndex) {
        this.getPage(pageIndex, enyo.bind(this, function(page) {
            var pageComp = this.$.carousel.getClientControls()[pageIndex];
            var chuComps = pageComp.getClientControls();
            for (var i=0; i<chuComps.length; i++) {
                var image = page[i].thumbnails && page[i].thumbnails["100x100"] ? page[i].thumbnails["100x100"] : page[i].image;
                chuComps[i].getClientControls()[0].applyStyle("background-image", "url(" + image + ");");
            }
        }));
    },
    getPage: function(pageIndex, callback) {
        callback = callback || function() {};
        if (this.pages[pageIndex]) {
            callback(this.pages[pageIndex]);
        } else {
            chuisy.chu.list(this.filters, enyo.bind(this, function(sender, response) {
                this.pages[pageIndex] = response.objects;
                callback(response.objects);
            }), {limit: this.chusPerPage, offset: pageIndex * this.chusPerPage});
        }
    },
    buildPages: function() {
        var currentPageIndex = this.pageIndex;
        this.$.carousel.destroyClientControls();
        for (var i=0; i<this.pageCount; i++) {
            this.buildPage(i);
        }
        this.$.carousel.render();
        this.$.carousel.setIndexDirect(currentPageIndex);
        this.updatePageIndex();
    },
    buildPage: function(pageIndex) {
        this.$.carousel.createComponent({classes: "enyo-fill"});
        for (var i=0; i<this.chusPerPage; i++) {
            this.buildChu(pageIndex, i);
        }
    },
    buildChu: function(pageIndex, chuIndex) {
        var absChuIndex = pageIndex * this.chusPerPage + chuIndex;
        if (absChuIndex < this.count) {
            var page = this.$.carousel.getClientControls()[pageIndex];
            page.createComponent({classes: "chugrid-chu", pageIndex: pageIndex, chuIndex: chuIndex, ontap: "chuTap", owner: this, components: [
                {classes: "chugrid-chu-image"}
            ]});
        }
    },
    chuTap: function(sender, event) {
        if (this.pages[sender.pageIndex] && this.pages[sender.pageIndex][sender.chuIndex]) {
            var chu = this.pages[sender.pageIndex][sender.chuIndex];
            this.doChuSelected({originator: sender, chu: chu});
        }
    },
    updatePageIndex: function() {
        this.setPageIndex(this.$.carousel.getIndex());
    },
    reset: function() {
        this.pages = [];
        this.pageIndex = 0;
        this.pageIndexChanged();
    },
    components: [
        {kind: "Panels", name: "carousel", arrangerKind: "CarouselArranger", classes: "enyo-fill", onTransitionFinish: "updatePageIndex"},
        {kind: "Thumbs", classes: "chubox-thumbs"}
    ]
});