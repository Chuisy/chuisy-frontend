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
        this.$.chuboxItem0.setShowing((this.items[startIndex]));
        this.$.chuboxItem1.setItem(this.items[startIndex + 1]);
        this.$.chuboxItem1.setShowing((this.items[startIndex +1]));
        this.$.chuboxItem2.setItem(this.items[startIndex + 2]);
        this.$.chuboxItem2.setShowing((this.items[startIndex + 2]));

        return true;
    },
    itemTap: function(sender, event) {
        var index = event.index * 3 + sender.hIndex;
        this.doItemSelected({item: this.items[index]});
    },
    itemRemove: function(sender, event) {
        var item = this.items[event.index];
        chuisy.chuboxitem.remove(item.id, enyo.bind(this, function(sender, response) {
            this.log(response);
            this.loadItems();
        }));
    },
    components: [
        {kind: "List", name: "itemList", classes: "enyo-fill", onSetupItem: "setupItem", fixedHeight: true, components: [
            {kind: "MiniChuboxItem", name: "chuboxItem0", hIndex: 0, ontap: "itemTap", onRemove: "itemRemove"},
            {kind: "MiniChuboxItem", name: "chuboxItem1", hIndex: 1, ontap: "itemTap", onRemove: "itemRemove"},
            {kind: "MiniChuboxItem", name: "chuboxItem2", hIndex: 2, ontap: "itemTap", onRemove: "itemRemove"}
            //onhold: "itemHold", onmousedown: "itemMouseDown", onmouseup: "itemMouseUp", onmouseout: "itemMouseUp"}
        ]}
    ]
});