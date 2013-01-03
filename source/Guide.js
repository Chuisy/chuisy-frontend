enyo.kind({
    name: "Guide",
    classes: "guide",
    published: {
        view: ""
    },
    handlers: {
        ontap: "next"
    },
    views: {
        "feed": [
            {style: "background-image: url(assets/images/guide_feed_0.png)"},
            {style: "background-image: url(assets/images/guide_feed_1.png)"},
            {style: "background-image: url(assets/images/guide_feed_2.png)"}
        ],
        "chubox": [
            {style: "background-image: url(assets/images/guide_chubox_0.png)"}
        ],
        "profile": [
            {style: "background-image: url(assets/images/guide_profile_0.png)"},
            {style: "background-image: url(assets/images/guide_profile_1.png)"}
        ],
        "chu": [
            {style: "background-image: url(assets/images/guide_chu_1.png)"}
        ],
        "compose": [
            {style: "background-image: url(assets/images/guide_compose_1.png)"}
        ],
        "notifications": [
            {style: "background-image: url(assets/images/guide_notifications_0.png)"}
        ],
        "discover": [
            {style: "background-image: url(assets/images/guide_discover_0.png)"}
        ],
        "share": [
            {style: "background-image: url(assets/images/guide_share_0.png)"},
            {style: "background-image: url(assets/images/guide_share_1.png)"}
        ]
    },
    create: function() {
        this.inherited(arguments);
        this.$.panels.getAnimator().setDuration(800);
    },
    viewChanged: function() {
        this.$.panels.destroyClientControls();
        this.$.panels.createComponents(this.views[this.view] || []);
        this.$.panels.render();
    },
    open: function() {
        this.$.panels.setIndex(0);
        this.applyStyle("z-index", 1000);
        this.addClass("open");
    },
    close: function() {
        this.removeClass("open");
        setTimeout(enyo.bind(this, function() {
            this.applyStyle("z-index", -1000);
        }), 500);
    },
    next: function() {
        var currIndex = this.$.panels.getIndex();
        if (currIndex < this.$.panels.getPanels().length-1) {
            this.$.panels.setIndex(currIndex + 1);
        } else {
            this.close();
        }
    },
    components: [
        {kind: "Panels", classes: "enyo-fill guide-panels", components: [{}]}
    ]
});