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
            {style: "background: url(assets/images/guide/blank.png) no-repeat center top; background-size: 320px 568px;", components: [
                {classes: "guide-centered", style: "height: 250px", components: [
                    {classes: "guide-header", content: $L("Welcome to the Chu Flow")},
                    {classes: "guide-separator"},
                    {classes: "guide-text", content: $L("Use the Chu Flow to stay in the loop or your friend's " +
                        "shopping experiences and discover nice things from people with taste.")}
                ]},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]},
            {style: "background: url(assets/images/guide/bottom-left.png) no-repeat center bottom; background-size: 320px 568px;", components: [
                {classes: "guide-centered guide-dictionary", allowHtml: true, content: $L("Chu • [tʃuː], n") + "<br>" +
                    $L("A fashion item or accessoire discovered by a fashion enthusiast during 'window shopping'. " +
                        "Often used to express style or get feedback from friends.")},
                    {style: "width: 130px; position: absolute; bottom: 60px; left: 95px;", content: $L("Push the button to post a Chu")}
            ]},
            {style: "background: url(assets/images/guide/menu.png) no-repeat center top; background-size: 320px 568px;", components: [
                {classes: "guide-centered", style: "height: 65px;", content: "When you are ready to move on, use the bar above to check out the rest of the app."}
            ]}
        ],
        "closet": [
        ],
        "profile": [
        ],
        "chu": [
        ],
        "compose": [
        ],
        "notifications": [
        ],
        "discover": [
        ],
        "share": [
        ]
    },
    create: function() {
        this.inherited(arguments);
        this.$.panels.getAnimator().setDuration(800);
    },
    viewChanged: function() {
        this.$.panels.destroyClientControls();
        var screens = this.views[this.view];
        if (screens) {
            for (var i=0; i<screens.length; i++) {
                this.$.panels.createComponent(screens[i]);
            }
            this.$.panels.render();
        } else {
            this.close();
        }
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