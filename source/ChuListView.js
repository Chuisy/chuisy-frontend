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
        if (!this.chus.meta.total_count) {
            this.$.spinner.show();
            this.chus.fetch({data: {count: 21, thumbnails: ["100x100"]}, success: enyo.bind(this, function() {
                this.$.spinner.hide();
            })});
        }
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
        {kind: "Spinner", style: "position: absolute; left: 0; right: 0; top: 64px; margin: 0 auto;"},
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", name: "title"}
        ]},
        {kind: "ChuList", fit: true}
    ]
});