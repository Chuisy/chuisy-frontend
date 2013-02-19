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
                    {classes: "guide-text", content: $L("Use the Chu Flow to stay in the loop of your friends' " +
                        "shopping experiences and discover nice things from people with taste.")}
                ]},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]},
            {style: "background: url(assets/images/guide/bottom-left.png) no-repeat left bottom; background-size: 320px 568px;", components: [
                {classes: "guide-centered guide-dictionary", allowHtml: true, content: $L("Chu • [tʃuː], n") + "<br>" +
                    $L("A fashion item or accessoire discovered by a fashion enthusiast during 'window shopping'. " +
                        "Often used to express style or get feedback from friends.")},
                    {classes: "guide-text", style: "width: 200px; position: absolute; bottom: 60px; left: 70px;", content: $L("You can post a Chu by pressing this button.")},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]},
            {style: "background: url(assets/images/guide/menu.png) no-repeat center top; background-size: 320px 568px;", components: [
                {classes: "guide-text", style: "width: 230px; margin: 100px auto;", content: $L("This is the menu bar. Use it to move around.")},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]}
        ],
        "closet": [
            {style: "background: url(assets/images/guide/blank.png) no-repeat center top; background-size: 320px 568px;", components: [
                {classes: "guide-centered", style: "height: 150px", components: [
                    {classes: "guide-header", content: $L("Your closet that never ends")},
                    {classes: "guide-separator"},
                    {classes: "guide-text", content: $L("Here you can find all your Chus. Be chuisy and fill it while shopping!")}
                ]},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]}
        ],
        "profile": [
            {style: "background: url(assets/images/guide/blank.png) no-repeat center top; background-size: 320px 568px;", components: [
                {classes: "guide-centered", style: "height: 150px", components: [
                    {classes: "guide-header", content: $L("Hey, self!")},
                    {classes: "guide-separator"},
                    {classes: "guide-text", content: $L("This is your profile, the place where your followers and friends can visit you.")}
                ]},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]},
            {style: "background: url(assets/images/guide/settings.png) no-repeat right top; background-size: 320px 568px;", components: [
                {classes: "guide-text", style: "position: absolute; top: 150px; right: 80px; width: 160px;", content: $L("You can also find your settings here.")},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]}
        ],
        "chu": [
            {style: "background: url(assets/images/guide/top-right.png) no-repeat right top; background-size: 320px 568px;", components: [
                {classes: "guide-text", style: "position: absolute; width: 200px; top: 60px; right: 40px;", content: $L("Share your discovery or keep it a secret. It's your choice.")},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]},
            {style: "background: url(assets/images/guide/share.png) no-repeat right top; background-size: 320px 568px;", components: [
                {classes: "guide-text", style: "position: absolute; width: 240px; top: 70px; right: 15px;", content: $L("Let friends become part of the moment and share your shopping experiences.")},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]}
        ],
        "notifications": [
            {style: "background: url(assets/images/guide/blank.png) no-repeat center top; background-size: 320px 568px;", components: [
                {classes: "guide-centered", style: "height: 130px", components: [
                    {classes: "guide-header", content: $L("Your affairs")},
                    {classes: "guide-separator"},
                    {classes: "guide-text", content: $L("Come here to see what's hot and new.")}
                ]},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]}
        ],
        "discover": [
            {style: "background: url(assets/images/guide/blank.png) no-repeat center top; background-size: 320px 568px;", components: [
                {classes: "guide-centered", style: "height: 150px", components: [
                    {classes: "guide-header", content: $L("Discover")},
                    {classes: "guide-separator"},
                    {classes: "guide-text", content: $L("Find the hottest people, products and stores on Chuisy.")}
                ]},
                {classes: "guide-continue", content: $L("(tap to continue)")}
            ]}
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