enyo.kind({
    name: "Chubox",
    classes: "chubox",
    events: {
        onChuSelected: "",
        onToggleMenu: "",
        onComposeChu: "",
        onShowNotifications: ""
    },
    handlers: {
        onresize: "refreshChus",
        onhold: "startEditing"
    },
    rowCount: 0,
    colCount: 0,
    pageCount: 0,
    chusPerPage: 0,
    chus: [],
    rendered: function() {
        this.inherited(arguments);
        this.refreshChus();
    },
    calculateGrid: function() {
        this.colCount = Math.floor(this.getBounds().width / 100);
        this.rowCount = Math.floor(this.getBounds().height / 100);
        this.chusPerPage = this.colCount * this.rowCount;
        this.pageCount = this.chusPerPage ? Math.ceil(this.chus.length / this.chusPerPage) : 0;
    },
    startEditing: function(sender, event) {
        this.editing = true;
        this.$.notificationsButton.hide();
        this.$.doneButton.show();
        this.addClass("editing");
        event.preventDefault();
    },
    finishEditing: function() {
        this.editing = false;
        this.removeClass("editing");
        this.$.doneButton.hide();
        this.$.notificationsButton.show();
    },
    refreshChus: function() {
        this.chus = chuisy.chubox.getChus();
        this.calculateGrid();
        var currentPageIndex = this.$.carousel.getIndex();
        this.$.carousel.destroyClientControls();

        for (var i=0; i<this.pageCount; i++) {
            this.buildPage(i);
        }

        this.$.carousel.render();
        this.$.thumbs.setCount(this.pageCount);
        if (currentPageIndex && currentPageIndex < this.pageCount) {
            this.$.carousel.setIndexDirect(currentPageIndex);
            this.updatePageIndex();
        }
    },
    buildPage: function(pageIndex) {
        this.$.carousel.createComponent({classes: "enyo-fill"});
        for (var i=0; i<this.chusPerPage; i++) {
            var chuIndex = pageIndex * this.chusPerPage + i;
            this.buildChu(pageIndex, chuIndex);
        }
    },
    buildChu: function(pageIndex, chuIndex) {
        var chu = this.chus[chuIndex];

        if (chu) {
            var page = this.$.carousel.getClientControls()[pageIndex];
            var image = chu.localImage || (chu.thumbnails ? chu.thumbnails["100x100"] : chu.image) || "assets/images/chu_placeholder.png";
            page.createComponent({classes: "chubox-chu", pageIndex: pageIndex, chuIndex: chuIndex, ontap: "chuTap", owner: this, components: [
                {classes: "chubox-chu-image", style: "background-image: url(" + image + ");"},
                {kind: "Button", classes: "chubox-delete-button", ontap: "chuRemove", chuIndex: chuIndex}
            ]});
        }
    },
    chuTap: function(sender, event) {
        if (!this.editing) {
            this.doChuSelected({chu: this.chus[sender.chuIndex]});
        }
    },
    updatePageIndex: function() {
        this.$.thumbs.setIndex(this.$.carousel.getIndex());
    },
    chuRemove: function(sender, event) {
        var chu = this.chus[sender.chuIndex];
        chuisy.chubox.remove(chu);
        return true;
    },
    notificationsUpdated: function(sender, event) {
        this.$.notificationBadge.setContent(event.unread_count);
        this.$.notificationBadge.setShowing(event.unread_count);
        return true;
    },
    components: [
        {kind: "Thumbs", classes: "chubox-thumbs"},
        {kind: "Signals", onChuboxUpdated: "refreshChus", onNotificationsUpdated: "notificationsUpdated"},
        {classes: "post-chu-button", ontap: "doComposeChu"},
        {kind: "FittableRows", classes: "enyo-fill", components: [
            {classes: "mainheader", components: [
                {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", name: "menuButton", components: [
                    {classes: "menu-button-icon"}
                ]},
                {classes: "mainheader-text", content: "Chu Box"},
                {kind: "onyx.Button", ontap: "finishEditing", classes: "done-button", content: "done", name: "doneButton", showing: false},
                {kind: "onyx.Button", name: "notificationsButton", classes: "notification-button", ontap: "doShowNotifications", components: [
                    {classes: "notification-button-icon"},
                    {classes: "notification-button-badge", name: "notificationBadge", content: "0", showing: false}
                ]}
            ]},
            {kind: "Panels", name: "carousel", arrangerKind: "CarouselArranger", fit: true, onTransitionFinish: "updatePageIndex"}
        ]}
    ]
});