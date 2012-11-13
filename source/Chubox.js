enyo.kind({
    name: "ChuboxView",
    kind: "FittableRows",
    classes: "chuboxview",
    published: {
        user: null // The currently signed in user
    },
    authUserChanged: function(sender, event) {
        if (!this.authUser || this.authUser.id != event.user.id) {
            this.authUser = event.user;
            if (this.user == "me") {
                this.userChanged();
            }
        }
    },
    userChanged: function() {
        var user = this.user == "me" ? this.authUser : this.user;
        if (user) {
            this.$.chubox.setUser(user);
        }
        this.$.menuButton.setShowing(this.user == "me");
        this.$.backButton.setShowing(this.user != "me");
    },
    events: {
        onChuSelected: "",
        onToggleMenu: ""
    },
    refresh: function() {
        this.$.chubox.loadChus();
    },
    startEditing: function() {
        this.$.doneButton.show();
    },
    done: function() {
        this.$.chubox.setEditing(false);
        this.$.doneButton.hide();
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", name: "menuButton", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back", name: "backButton"},
            {classes: "mainheader-text", content: "Chu Box"},
            {kind: "onyx.Button", ontap: "done", classes: "done-button", content: "done", name: "doneButton", showing: false}
        ]},
        {kind: "Chubox", name: "chubox", fit: true, editable: true, onStartEditing: "startEditing"},
        {kind: "Signals", onUserChanged: "authUserChanged"}
    ]
});

enyo.kind({
    name: "Chubox",
    classes: "chubox",
    published: {
        user: null,
        editable: false,
        editing: false
    },
    events: {
        onChuSelected: "",
        onStartEditing: "",
        onFinishEditing: ""
    },
    handlers: {
        onresize: "refreshChus",
        onhold: "hold"
    },
    userChanged: function() {
        if (this.user) {
            this.loadChus();
        }
    },
    editingChanged: function() {
        if (this.editing && !this.editable) {
            this.warn("'editing' can't be set to true when 'editable' is false!");
            this.editing = false;
        }

        this.addRemoveClass("editing", this.editing);
    },
    loadChus: function() {
        if (this.user) {
            chuisy.chu.list([["user", this.user.id]], enyo.bind(this, function(sender, response) {
                this.chus = response.objects;
                this.refreshChus();
            }));
        }
    },
    refreshChus: function() {
        if (this.chus) {
            var currentPageIndex = this.$.carousel.getIndex();
            var colCount = Math.floor(this.getBounds().width / 100);
            var rowCount = Math.floor(this.getBounds().height / 100);
            if (colCount && rowCount) {
                this.chuCount = colCount * rowCount;
                this.pageCount = Math.ceil(this.chus.length / this.chuCount);
                this.$.carousel.destroyClientControls();

                for (var i=0; i<this.pageCount; i++) {
                    this.buildPage(i);
                }
                this.$.carousel.render();
            }
            this.$.thumbs.setCount(this.pageCount);
            if (currentPageIndex && currentPageIndex< this.pageCount) {
                this.$.carousel.setIndexDirect(currentPageIndex);
                this.updatePageIndex();
            }
        }
    },
    buildPage: function(pageIndex) {
        this.$.carousel.createComponent({classes: "enyo-fill"});
        for (var i=0; i<this.chuCount; i++) {
            var chuIndex = pageIndex * this.chuCount + i;
            this.buildChu(pageIndex, chuIndex);
        }
    },
    buildChu: function(pageIndex, chuIndex) {
        var chu = this.chus[chuIndex];

        if (chu) {
            var page = this.$.carousel.getClientControls()[pageIndex];
            page.createComponent({classes: "chubox-chu", pageIndex: pageIndex, chuIndex: chuIndex, ontap: "chuTap", owner: this, components: [
                {kind: "Image", classes: "chubox-chu-image", src: chu.thumbnails["100x100"] || "assets/images/chu_placeholder.png"},
                {kind: "Button", classes: "chubox-delete-button", ontap: "chuRemove", chuIndex: chuIndex}
            ]});
        }
    },
    chuTap: function(sender, event) {
        if (!this.editing) {
            this.doChuSelected({originator: sender, chu: this.chus[sender.chuIndex]});
        }
    },
    updatePageIndex: function() {
        this.$.thumbs.setIndex(this.$.carousel.getIndex());
    },
    hold: function() {
        if (this.editable) {
            this.setEditing(true);
            this.doStartEditing();
        }
    },
    chuRemove: function(sender, event) {
        var chu = this.chus[sender.chuIndex];
        chuisy.chu.remove(chu.id, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
        this.chus.remove(sender.chuIndex);
        this.refreshChus();
        return true;
    },
    components: [
        {kind: "Panels", name: "carousel", arrangerKind: "CarouselArranger", classes: "enyo-fill", onTransitionFinish: "updatePageIndex"},
        {kind: "Thumbs", classes: "chubox-thumbs"},
        {kind: "Signals", onUserChanged: "authUserChanged"}
    ]
});