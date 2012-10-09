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
        {kind: "Scroller", classes: "enyo-fill", components: [
            {classes: "notification-button", content: "3"},
            {classes: "main-content", components: [
                {kind: "Repeater", name: "chuList", onSetupItem: "setupChu", components: [
                    {kind: "ListChu", ontap: "chuTapped", style: "width: 100%;"}
                ]}
            ]}
        ]},
        {kind: "Slideable", overMoving: false, unit: "px", min: -300, max: 0, classes: "secondarypanels shadow-left"}
    ]
});