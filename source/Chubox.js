enyo.kind({
    name: "Chubox",
    classes: "chubox",
    kind: "FittableColumns",
    published: {
        user: null, // The currently signed in user
        boxOwner: null // The owner of this Chubox
    },
    events: {
        onItemSelected: ""
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
        c.setOwned(this.user && this.user.id == this.boxOwner.id);
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
    newItemClicked: function() {
        this.$.productForm.clear();
        this.$.secondaryPanels.setIndex(1);
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
    itemCollect: function(sender, event) {
        var item = this.items[event.index];
        this.log(item);
        var data = {
            product: item.product.resource_uri,
            user: this.user.resource_uri
        };
        chuisy.chuboxitem.create(data, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
    },
    components: [
        {kind: "Scroller", style: "text-align: center;", fit: true, components: [
            {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                {kind: "ChuboxItem", ontap: "itemTap", onRemove: "itemRemove", onCollect: "itemCollect"}
                //onhold: "itemHold", onmousedown: "itemMouseDown", onmouseup: "itemMouseUp", onmouseout: "itemMouseUp"}
            ]}
        ]},
        {kind: "Panels", name: "secondaryPanels", arrangerKind: "CarouselArranger", classes: "secondarypanels shadow-left", components: [
            {classes: "enyo-fill", components: [
                {kind: "onyx.Button", content: "New Item", ontap: "newItemClicked"}
            ]},
            {classes: "enyo-fill", components: [
                {kind: "ProductForm"},
                {kind: "onyx.Button", content: "Save", ontap: "newItemSave"}
            ]}
        ]}
    ]
});