enyo.kind({
    name: "ChuFeed",
    published: {
        user: null
    },
    events: {
        onChuSelected: ""
    },
    userChanged: function() {
        this.loadChus();
    },
    loadChus: function() {
        chuisy.homefeed.list([], enyo.bind(this, function(sender, response) {
            this.chus = response.objects;
            this.refreshChus();
        }));
    },
    refreshChus: function() {
        this.$.chuList.setCount(this.chus.length);
        this.$.chuList.render();
    },
    setupChu: function(sender, event) {
        var chu = this.chus[event.index];
        event.item.$.listChu.setChu(chu);
    },
    chuTapped: function(sender, event) {
        var chu = this.chus[event.index];
        this.doChuSelected({chu: chu});
    },
    components: [
        {kind: "Repeater", name: "chuList", onSetupItem: "setupChu", classes: "enyo-fill", components: [
            {kind: "ListChu", ontap: "chuTapped", style: "width: 100%;"}
        ]}
    ]
});

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
            this.log(this.chu);
            this.$.title.setContent(this.chu.title);
            this.$.avatar.setSrc(this.chu.user.profile.avatar);
            this.refreshChuItems();
        }
    },
    refreshChuItems: function() {
        this.$.itemRepeater.setCount(this.chu.items.length);
        this.$.itemRepeater.render();
    },
    setupRepeaterItem: function(sender, event) {
        if (this.chu) {
            var c = event.item.$.miniChuItem;
            var item = this.chu.items[event.index];
            c.setItem(item);
        }
        // var rot = Math.random() * 20 - 10; // Rotate by a random angle between -10 and 10 deg
        // c.applyStyle("transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-webkit-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-ms-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-moz-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-o-transform", "rotate(" + rot + "deg)");
        return true;
    },
    components: [
        {kind: "Image", name: "avatar", classes: "listchu-avatar"},
        {fit: true, components: [
            {name: "title", classes: "listchu-title"},
            {kind: "onyx.IconButton", src: "assets/images/x.png", classes: "listchu-toolbutton"},
            {kind: "Scroller", classes: "listchu-scroller", components: [
                {kind: "Repeater", style: "white-space: nowrap;", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                    {kind: "MiniChuItem"}
                ]}
            ]}
        ]}
    ]
});