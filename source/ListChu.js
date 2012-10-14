enyo.kind({
    name: "ListChu",
    kind: "onyx.Item",
    tapHighlight: true,
    noStretch: true,
    classes: "listchu",
    published: {
        chu: null
    },
    chuChanged: function() {
        if (this.chu) {
            this.$.title.setContent(this.chu.title);
            this.$.avatar.setSrc(this.chu.user.profile.avatar);
            this.refreshChuItems();
        }
    },
    refreshChuItems: function() {
        for (var i=0; i<3; i++) {
            this.setupItem(i);
        }
    },
    setupItem: function(index) {
        var component = this.$["item" + index];
        var item = this.chu.items[index];
        component.setItem(item);
        component.setShowing((item));
        var rot = Math.random() * 20 - 10; // Rotate by a random angle between -5 and 5 deg
        component.applyStyle("-webkit-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-ms-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-moz-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-o-transform", "rotate(" + rot + "deg)");
    },
    components: [
        {classes: "listchu-header", components: [
            {kind: "Image", name: "avatar", classes: "listchu-avatar"},
            {classes: "listchu-header-right", components: [
                {name: "title", classes: "listchu-title"},
                {name: "time", classes: "listchu-time", content: "1 hour ago"}
            ]}
        ]},
        // {kind: "onyx.IconButton", src: "assets/images/x.png", classes: "listchu-toolbutton"},
        {classes: "listchu-itemrepeater", components: [
            {kind: "MiniChuboxItem", name: "item0"},
            {kind: "MiniChuboxItem", name: "item1"},
            {kind: "MiniChuboxItem", name: "item2"}
        ]}
    ]
});