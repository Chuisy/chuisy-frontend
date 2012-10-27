enyo.kind({
    name: "ChuboxView",
    kind: "FittableRows",
    classes: "chubox",
    published: {
        user: null // The currently signed in user
    },
    userChanged: function() {
        this.$.chubox.setUser(this.user);
        this.$.chubox.setBoxOwner(this.user);
    },
    events: {
        onItemSelected: "",
        onToggleMenu: ""
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {classes: "mainheader-text", content: "Chu Box"}
        ]},
        {kind: "Chubox", name: "chubox", fit: true}
    ]
});

enyo.kind({
    name: "Chubox",
        published: {
        user: null, // The currently signed in user
        boxOwner: null // The owner of this Chubox
    },
    events: {
        onItemSelected: ""
    },
    handlers: {
        onresize: "refreshItems"
    },
    userChanged: function() {
        this.refreshItems();
    },
    boxOwnerChanged: function() {
        if (this.boxOwner) {
            this.loadItems();
        }
    },
    loadItems: function() {
        chuisy.chuboxitem.list([["user", this.boxOwner.id]], enyo.bind(this, function(sender, response) {
            this.items = response.objects;
            this.refreshItems();
        }));
    },
    refreshItems: function() {
        if (this.items) {
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
        }
    },
    buildPage: function(pageIndex) {
        this.$.carousel.createComponent({classes: "enyo-fill"});
        for (var i=0; i<this.itemCount; i++) {
            this.buildItem(pageIndex, (pageIndex+1) * i);
        }
    },
    buildItem: function(pageIndex, itemIndex) {
        var item = this.items[itemIndex];

        if (item) {
            var page = this.$.carousel.getClientControls()[pageIndex];
            page.createComponent({classes: "chuboxitem", pageIndex: pageIndex, itemIndex: itemIndex, ontap: "itemTap", owner: this, components: [
                {kind: "Image", classes: "chuboxitem-image", src: item.image}
            ]});
        }
    },
    itemTap: function(sender, event) {
        this.doItemSelected({originator: sender, item: this.items[sender.itemIndex]});
    },
    itemRemove: function(sender, event) {
        var item = this.items[event.index];
        chuisy.chuboxitem.remove(item.id, enyo.bind(this, function(sender, response) {
            this.log(response);
            this.loadItems();
        }));
    },
    components: [
        {kind: "Panels", name: "carousel", arrangerKind: "CarouselArranger", classes: "enyo-fill"}
    ]
});