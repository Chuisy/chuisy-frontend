enyo.kind({
    name: "Chubox",
    kind: "FittableRows",
    classes: "chubox",
    published: {
        user: null, // The currently signed in user
        boxOwner: null // The owner of this Chubox
    },
    events: {
        onItemSelected: "",
        onToggleMenu: ""
    },
    handlers: {
        ondrag: "drag",
        ondragfinish: "dragFinish",
        // ondragstart: "dragStart",
        onmouseup: "mouseUp"
    },
    create: function() {
        this.inherited(arguments);
        this.userChanged();
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
        this.$.itemList.setCount(this.items ? Math.ceil(this.items.length/3) : 0);
        this.$.itemList.refresh();
    },
    setupItem: function(sender, event) {
        var startIndex = event.index * 3;

        this.$.chuboxItem0.setItem(this.items[startIndex]);
        this.$.chuboxItem1.setItem(this.items[startIndex + 1]);
        this.$.chuboxItem2.setItem(this.items[startIndex + 2]);
    },
    itemHold: function(sender, event) {
        this.log(event);
        this.createComponent({kind: "DragAvatar", offsetX: -150, offsetY: 150, name: "dragAvatar", components: [
            {kind: "ChuboxItem", item: this.items[event.index]}
        ]});
        this.dragging = true;
        this.$.dragAvatar.drag(event);
    },
    drag: function(sender, event) {
        if (this.dragging) {
            this.$.dragAvatar.drag(event);
            this.itemHeld = false;
        }
    },
    dragFinish: function() {
        if (this.dragging) {
            this.$.dragAvatar.destroy();
            this.dragging = false;
            document.body.style.cursor = "auto";
        }
    },
    mouseUp: function(sender, event) {
        if (this.dragging) {
            this.$.dragAvatar.destroy();
            this.dragging = false;
            document.body.style.cursor = "auto";
        }
    },
    itemMouseDown: function(sender, event) {
        sender.addClass("highlight");
    },
    itemMouseUp: function(sender, event) {
        sender.removeClass("highlight");
    },
    itemTap: function(sender, event) {
        // this.doItemSelected({item: this.items[event.index]});
    },
    newItemSave: function() {
        var data = {
            user: this.user.resource_uri,
            // product: this.$.productForm.getData()
            product: "/v1/product/1/"
        };
        this.log(data);
        chuisy.chuboxitem.create(data, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
    },
    itemRemove: function(sender, event) {
        var item = this.items[event.index];
        chuisy.chuboxitem.remove(item.id, enyo.bind(this, function(sender, response) {
            this.log(response);
            this.loadItems();
        }));
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {classes: "mainheader-text", content: "Chu Box"}
        ]},
        {kind: "List", name: "itemList", fit: true, onSetupItem: "setupItem", components: [
            {kind: "MiniChuboxItem", name: "chuboxItem0", hIndex: 0, ontap: "itemTap", onRemove: "itemRemove"},
            {kind: "MiniChuboxItem", name: "chuboxItem1", hIndex: 1, ontap: "itemTap", onRemove: "itemRemove"},
            {kind: "MiniChuboxItem", name: "chuboxItem2", hIndex: 2, ontap: "itemTap", onRemove: "itemRemove"}
            //onhold: "itemHold", onmousedown: "itemMouseDown", onmouseup: "itemMouseUp", onmouseout: "itemMouseUp"}
        ]}
    ]
});