enyo.kind({
    name: "Chubox",
    classes: "chubox",
    kind: "FittableColumns",
    published: {
        user: null
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
        if (this.user) {
            this.loadItems();
        }
    },
    loadItems: function() {
        chuisy.chuboxitem.list([["user", this.user.profile.id]], enyo.bind(this, function(sender, response) {
            this.items = response.objects;
            this.refreshItems();
        }));
    },
    refreshItems: function() {
        this.$.itemRepeater.setCount(this.items.length);
        this.$.itemRepeater.render();
    },
    setupRepeaterItem: function(sender, event) {
        var c = event.item.$.chuboxItem;
        var item = this.items[event.index];
        c.setItem(item);
        var rot = Math.random() * 20 - 10; // Rotate by a random angle between -10 and 10 deg
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
        this.log(event);
        this.doItemSelected({item: this.items[event.index]});
    },
    newItemClicked: function() {
        this.$.productForm.clear();
        this.$.secondaryPanels.setIndex(1);
    },
    newItemSave: function() {
        var data = {
            user: this.user.profile.resource_uri,
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
        {kind: "Scroller", fit: true, components: [
            {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                {kind: "ChuboxItem", ontap: "itemTap", onRemove: "itemRemove"}
                //onhold: "itemHold", onmousedown: "itemMouseDown", onmouseup: "itemMouseUp", onmouseout: "itemMouseUp"}
            ]}
        ]},
        {kind: "Panels", name: "secondaryPanels", arrangerKind: "CarouselArranger", classes: "secondarypanels shadow-left", components: [
            ]}
        ]}
    ]
});