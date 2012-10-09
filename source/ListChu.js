enyo.kind({
    name: "ListChu",
    kind: "onyx.Item",
    tapHighlight: true,
    layoutKind: "FittableColumnsLayout",
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
    },
    components: [
        {kind: "Image", name: "avatar", classes: "listchu-avatar"},
        {fit: true, components: [
            {name: "title", classes: "listchu-title"},
            // {kind: "onyx.IconButton", src: "assets/images/x.png", classes: "listchu-toolbutton"},
            {style: "white-space: nowrap;", components: [
                {kind: "MiniChuboxItem", name: "item0"},
                {kind: "MiniChuboxItem", name: "item1"},
                {kind: "MiniChuboxItem", name: "item2"}
            ]}
        ]}
    ]
});