enyo.kind({
    name: "MainView",
    narrowWidth: 800,
    published: {
        // menuShowing: true,
        // infoSliderShowing: true,
        user: null
    },
    isNarrow: function() {
        return this.getBounds().width < this.narrowWidth;
    },
    userChanged: function() {
        this.$.chubox.setUser(this.user);
    },
    // menuShowingChanged: function() {
    //     this.$.menuButton.addRemoveClass("active", this.menuShowing);
    //     this.$.appPanels.setIndex(this.menuShowing ? 0 : 1);
    // },
    // infoSliderShowingChanged: function() {
    //     this.$.infoSliderButton.addRemoveClass("active", this.infoSliderShowing);
    //     if (this.infoSliderShowing) {
    //         this.$.infoSlider.animateToMin();
    //     } else {
    //         this.$.infoSlider.animateToMax();
    //     }
    // },
    rendered: function() {
        this.inherited(arguments);
        // this.setMenuShowing(!this.isNarrow());
        this.resizeHandler();
    },
    // toggleMenu: function() {
    //     this.setMenuShowing(!this.menuShowing);
    // },
    // toggleInfoSlider: function() {
    //     this.setInfoSliderShowing(!this.infoSliderShowing);
    // },
    // resizeHandler: function() {
    //     this.inherited(arguments);
    //     var narrow = this.isNarrow();
    //     this.addRemoveClass("narrow", narrow);
    //     this.$.contentPanels.setFit(!narrow);
    //     this.$.infoSlider.setMin(narrow ? -200 : 0);
    //     this.$.infoSlider.setMax(narrow ? 10 : 0);
    //     this.$.infoSliderButton.setShowing(narrow);
    //     this.$.mainPanel.render();
    //     this.setInfoSliderShowing(!narrow);
    // },
    chuboxItemSelected: function(sender, event) {
        this.$.productView.setProduct(event.item.product);
        this.$.contentPanels.setIndex(1);
        setTimeout(enyo.bind(this, function() {
            this.$.productView.resized();
        }), 20);
    },
    contentPanelsBack: function() {
        this.$.contentPanels.setIndex(0);
    },
    components: [
        {classes: "mainheader", kind: "FittableColumns", components: [
            {classes: "mainheader-text", fit: true, content: "chuisy"}
            // {kind: "onyx.Button", name: "infoSliderButton", ontap: "toggleInfoSlider", components: [
            //  {kind: "Image", src: "assets/images/menu-icon.png"}
            // ]}
        ]},
        {kind: "FittableColumns", fit: true, components: [
            {classes: "mainmenu", style: "text-align: center; padding: 200px 0; font-size: 20pt;", content: "menu"},
            {kind: "Panels", arrangerKind: "CardArranger", fit: true, draggable: false, classes: "shadow-left", name: "primaryPanels", components: [
                // {kind: "ChuFeed"},
                {kind: "Chubox", onItemSelected: "chuboxItemSelected", user: {profile: {id: 2}}},
                // {kind: "ChuView"},
                {kind: "Scroller", components: [
                    {kind: "ProductView", onBack: "contentPanelsBack"}
                ]}
            ]}
        ]}
    ]
});