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
        onItemSelected: "",
        onToggleMenu: ""
    },
    refresh: function() {
        this.$.chubox.loadItems();
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
        onItemSelected: "",
        onStartEditing: "",
        onFinishEditing: ""
    },
    handlers: {
        onresize: "refreshItems",
        onhold: "hold"
    },
    userChanged: function() {
        if (this.user) {
            this.loadItems();
        }
    },
    editingChanged: function() {
        if (this.editing && !this.editable) {
            this.warn("'editing' can't be set to true when 'editable' is false!");
            this.editing = false;
        }

        this.addRemoveClass("editing", this.editing);
    },
    loadItems: function() {
        if (this.user) {
            chuisy.chuboxitem.list([["user", this.user.id]], enyo.bind(this, function(sender, response) {
                this.items = response.objects;
                this.refreshItems();
            }));
        }
    },
    refreshItems: function() {
        if (this.items) {
            var currentPageIndex = this.$.carousel.getIndex();
            var colCount = Math.floor(this.getBounds().width / 100);
            var rowCount = Math.floor(this.getBounds().height / 100);
            if (colCount && rowCount) {
                this.itemCount = colCount * rowCount;
                this.pageCount = Math.ceil(this.items.length / this.itemCount);
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
        for (var i=0; i<this.itemCount; i++) {
            var itemIndex = pageIndex * this.itemCount + i;
            this.buildItem(pageIndex, itemIndex);
        }
    },
    buildItem: function(pageIndex, itemIndex) {
        var item = this.items[itemIndex];

        if (item) {
            var page = this.$.carousel.getClientControls()[pageIndex];
            page.createComponent({classes: "chuboxitem", pageIndex: pageIndex, itemIndex: itemIndex, ontap: "itemTap", owner: this, components: [
                {kind: "Image", classes: "chuboxitem-image", src: item.thumbnails["100x100"]},
                {kind: "Button", classes: "chubox-delete-button", ontap: "itemRemove", itemIndex: itemIndex}
            ]});
        }
    },
    itemTap: function(sender, event) {
        if (!this.editing) {
            this.doItemSelected({originator: sender, item: this.items[sender.itemIndex]});
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
    itemRemove: function(sender, event) {
        var item = this.items[sender.itemIndex];
        chuisy.chuboxitem.remove(item.id, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
        this.items.remove(sender.itemIndex);
        this.refreshItems();
        return true;
    },
    components: [
        {kind: "Panels", name: "carousel", arrangerKind: "CarouselArranger", classes: "enyo-fill", onTransitionFinish: "updatePageIndex"},
        {kind: "Thumbs", classes: "chubox-thumbs"},
        {kind: "Signals", onUserChanged: "authUserChanged"}
    ]
});