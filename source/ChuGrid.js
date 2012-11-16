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
        this.pageIndexChanged();
    },
    countChanged: function() {        
        this.calculateGrid();
        this.$.thumbs.setCount(this.pageCount);
        this.buildPages();
    },
    pageIndexChanged: function() {
        this.$.thumbs.setIndex(this.pageIndex);
        this.$.carousel.setIndex(this.pageIndex);
        this.loadPage(this.pageIndex);
        if (this.pageIndex > 0) {
            this.loadPage(this.pageIndex-1);
        }
        if (this.pageIndex < this.pageCount) {
            this.loadPage(this.pageIndex+1);
        }
    },
    calculateGrid: function() {
        this.colCount = Math.floor(this.getBounds().width / 100);
        this.rowCount = Math.floor(this.getBounds().height / 100);
        this.chusPerPage = this.colCount * this.rowCount;
        this.pageCount = Math.ceil(this.count / this.chusPerPage);
    },
    loadPage: function(pageIndex) {
        this.getPage(pageIndex, enyo.bind(this, function(page) {
            var pageComp = this.$.carousel.getClientControls()[pageIndex];
            var chuComps = pageComp.getClientControls();
            for (var i=0; i<chuComps.length; i++) {
                chuComps[i].getClientControls()[0].setSrc(page[i].thumbnails["100x100"]);
            }
        }));
    },
    getPage: function(pageIndex, callback) {
        callback = callback || function() {};
        if (this.pages[pageIndex]) {
            callback(this.pages[pageIndex]);
        } else {
            this.log("Loading page " + pageIndex + "...");
            chuisy.chu.list(this.filters, enyo.bind(this, function(sender, response) {
                // if (!this.count || response.meta.total_count < this.count) {
                //     this.setCount(response.meta.total_count);
                // }
                this.pages[pageIndex] = response.objects;
                callback(response.objects);
            }), {limit: this.chusPerPage, offset: pageIndex * this.chusPerPage});
        }
    },
    refreshChus: function() {
        if (this.chus) {
            var currentPageIndex = this.$.carousel.getIndex();
            if (colCount && rowCount) {                
                
            }
            if (currentPageIndex && currentPageIndex< this.pageCount) {
                this.$.carousel.setIndexDirect(currentPageIndex);
                this.updatePageIndex();
            }
        }
    },
    buildPages: function() {
        this.$.carousel.destroyClientControls();
        for (var i=0; i<this.pageCount; i++) {
            this.buildPage(i);
        }
        this.$.carousel.render();

    },
    buildPage: function(pageIndex) {
        this.$.carousel.createComponent({classes: "enyo-fill"});
        for (var i=0; i<this.chusPerPage; i++) {
            var chuIndex = pageIndex * this.chusPerPage + i;
            this.buildChu(pageIndex, chuIndex);
        }
    },
    buildChu: function(pageIndex, chuIndex) {
        var absChuIndex = pageIndex * this.chusPerPage + chuIndex;
        if (absChuIndex < this.count) {
            var page = this.$.carousel.getClientControls()[pageIndex];
            page.createComponent({classes: "chugrid-chu", pageIndex: pageIndex, chuIndex: chuIndex, ontap: "chuTap", owner: this, components: [
                {kind: "Image", classes: "chugrid-chu-image"}
            ]});
        }
    },
    chuTap: function(sender, event) {
        if (!this.editing) {
            this.doChuSelected({originator: sender, chu: this.pages[sender.pageIndex][sender.chuIndex]});
        }
    },
    updatePageIndex: function() {
        this.setPageIndex(this.$.carousel.getIndex());
    },
    components: [
        {kind: "Panels", name: "carousel", arrangerKind: "CarouselArranger", classes: "enyo-fill", onTransitionFinish: "updatePageIndex"},
        {kind: "Thumbs", classes: "chubox-thumbs"}
    ]
});