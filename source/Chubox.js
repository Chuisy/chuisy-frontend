enyo.kind({
    name: "Chubox",
    classes: "chubox",
    published: {
        user: null
    },
    handlers: {
        ondrag: "drag",
        ondragfinish: "dragFinish",
        // ondragstart: "dragStart",
        onmouseup: "mouseUp"
    },
    create: function() {
        this.inherited(arguments);
        this.loadItems();
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
    setupItem: function(sender, event) {
        var c = event.item.$.chuboxItem;
        if (event.index == this.items.length) {
            c.hide();
            event.item.$.newItem.show();
        } else {
            var item = this.items[event.index];
            c.setItem(item);
            var rot = Math.random() * 30 - 15; // Rotate by a random angle between -15 and 15 deg
            c.applyStyle("-webkit-transform", "rotate(" + rot + "deg)");
            c.show();
            event.item.$.newItem.hide();
        }

    },
    itemHold: function(sender, event) {
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
            this.itemHeld = false;
            document.body.style.cursor = "auto";
        }
    },
    components: [
        {kind: "Scroller", classes: "enyo-fill", components: [
            {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupItem", components: [
                {kind: "ChuboxItem", onhold: "itemHold"},
                {classes: "chubox-newitem", name: "newItem"}
            ]}
        ]}
    ]
});