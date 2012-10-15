enyo.kind({
    name: "ChuFeed",
    kind: "FittableRows",
    published: {
        user: null
    },
    events: {
        onChuSelected: "",
        onToggleMenu: ""
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
        this.$.listChu.setChu(chu);
    },
    chuTapped: function(sender, event) {
        var chu = this.chus[event.index];
        this.doChuSelected({chu: chu});
    },
    components: [
        {kind: "FittableColumns", classes: "mainheader", content: "Chuisy", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {classes: "mainheader-text", content: "Chuisy"}
        ]},
        {kind: "Scroller", classes: "main-scroller", fit: true, components: [
            {classes: "main-content", components: [
                {kind: "FlyweightRepeater", name: "chuList", onSetupItem: "setupChu", components: [
                    {kind: "ListChu", ontap: "chuTapped", style: "width: 100%;"}
                ]}
            ]}
        ]},
        {kind: "Slideable", overMoving: false, unit: "px", min: -330, max: 0, classes: "secondarypanels shadow-left"}
    ]
});