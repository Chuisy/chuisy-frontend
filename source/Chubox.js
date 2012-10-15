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
        this.$.itemRepeater.setCount(this.items ? this.items.length : 0);
        this.$.itemRepeater.render();
    },
    setupRepeaterItem: function(sender, event) {
        var c = event.item.$.chuboxItem;
        var item = this.items[event.index];
        c.setItem(item);
        // c.setUser(this.user);
        // var rot = Math.random() * 20 - 10; // Rotate by a random angle between -10 and 10 deg
        // c.applyStyle("transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-webkit-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-ms-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-moz-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-o-transform", "rotate(" + rot + "deg)");
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
        this.doItemSelected({item: this.items[event.index]});
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
        {kind: "FittableColumns", classes: "mainheader", content: "Chuisy", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {classes: "mainheader-text", content: "Chu Box"}
        ]},
        {kind: "Scroller", fit: true, style: "text-align: center;", components: [
            {classes: "main-content", components: [
                {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                    {kind: "MiniChuboxItem", name: "chuboxItem", ontap: "itemTap", onRemove: "itemRemove"}
                    //onhold: "itemHold", onmousedown: "itemMouseDown", onmouseup: "itemMouseUp", onmouseout: "itemMouseUp"}
                ]}
            ]}
        ]}
    ]
});