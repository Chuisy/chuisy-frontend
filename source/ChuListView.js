enyo.kind({
    name: "ChuListView",
    kind: "FittableRows",
    events: {
        onBack: ""
    },
    published: {
        chus: null,
        title: ""
    },
    chusChanged: function() {
        this.$.chuList.setChus(this.chus);
    },
    titleChanged: function() {
        this.$.title.setContent(this.title);
    },
    activate: function() {
        this.$.chuList.show();
        this.resized();
    },
    deactivate: function() {
        this.$.chuList.hide();
    },
    components: [
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", name: "title"}
        ]},
        {kind: "ChuList", fit: true}
    ]
});