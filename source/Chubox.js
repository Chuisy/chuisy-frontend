enyo.kind({
    name: "Chubox",
    classes: "chubox",
    kind: "FittableRows",
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
        this.$.itemList.setCount(this.items.length);
        this.$.itemList.refresh();
    },
    setupRepeaterItem: function(sender, event) {
        var c = event.item.$.chuboxItem;
        var item = this.items[event.index];
        c.setItem(item);
        var rot = Math.random() * 20 - 10; // Rotate by a random angle between -10 and 10 deg
        c.applyStyle("transform", "rotate(" + rot + "deg)");
        c.applyStyle("-webkit-transform", "rotate(" + rot + "deg)");
        c.applyStyle("-ms-transform", "rotate(" + rot + "deg)");
        c.applyStyle("-moz-transform", "rotate(" + rot + "deg)");
        c.applyStyle("-o-transform", "rotate(" + rot + "deg)");
    },
    setupListItem: function(sender, event) {
        var item = this.items[event.index];
        this.$.listItem.setItem(item);
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
    itemTap: function() {
        this.doItemSelected({item: this.items[event.index]});
    },
    showGrid: function() {
        this.$.panels.setIndex(0);
    },
    showList: function() {
        this.$.panels.setIndex(1);
    },
    components: [
        {kind: "onyx.RadioGroup", components: [
            {content: "grid", ontap: "showGrid"},
            {content: "list", ontap: "showList"}
        ]},
        {kind: "Panels", fit: true, name: "panels", components: [
            {kind: "Scroller", style: "padding: 20px", classes: "enyo-fill", showing: true, components: [
                {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                    {kind: "ChuboxItem", onclick: "itemTap", onhold: "itemHold", onmousedown: "itemMouseDown", onmouseup: "itemMouseUp", onmouseout: "itemMouseUp"}
                ]}
            ]},
            // {kind: "Scroller", classes: "enyo-fill", components: [
                {kind: "List", style: "padding: 20px", classes: "enyo-fill", name: "itemList", onSetupItem: "setupListItem", components: [
                    {kind: "ChuboxListItem", name: "listItem", ontap: "itemTap", tapHighlight: true}
                ]}
            // ]}
        ]}
    ]
});