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
            "feed_0.png",
            "feed_1.png",
            "feed_2.png"
        ],
        "chubox": [
            "closet_0.png"
        ],
        "profile": [
            "profile_0.png",
            "profile_1.png"
        ],
        "chu": [
            "chu_1.png",
            "chu_2.png"
        ],
        "compose": [
            "compose_1.png"
        ],
        "notifications": [
            "affairs_0.png"
        ],
        "discover": [
            "discover_0.png"
        ],
        "share": [
            "share_0.png",
            "share_1.png"
        ]
    },
    create: function() {
        this.inherited(arguments);
        this.$.panels.getAnimator().setDuration(800);
    },
    viewChanged: function() {
        this.$.panels.destroyClientControls();
        var screens = this.views[this.view];
        for (var i=0; i<screens.length; i++) {
            this.$.panels.createComponent({style: "background-image: url(" + this.getImagesPath() + screens[i] + ")"});
        }
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
    getImagesPath: function() {
        var bounds = this.getBounds();
        return bounds.width/bounds.height >= 2/3 ? "assets/images/guide/2to3/" : "assets/images/guide/9to16/";
    },
    components: [
        {kind: "Panels", classes: "enyo-fill guide-panels", components: [{}]}
    ]
});