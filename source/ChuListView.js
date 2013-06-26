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
            this.$.nextPageSpinner.addClass("rise");
            this.chus.fetch({success: enyo.bind(this, function() {
                this.$.nextPageSpinner.removeClass("rise");
            }), data: {count: 21, thumbnails: ["100x100"]}});
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
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", name: "title"}
        ]},
        {kind: "ChuList", fit: true}
    ]
});