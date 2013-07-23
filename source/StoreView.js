enyo.kind({
    name: "StoreView",
    classes: "userview storeview",
    published: {
        store: null
    },
    events: {
        onBack: "",
        onShowChuList: "",
        onShowUserList: ""
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        var s = this.$.scroller.getStrategy();
        s.scrollIntervalMS = 17;
        this.positionParallaxElements();
    },
    storeChanged: function() {
        var rand = Math.ceil(Math.random()*3);
        this.coverPlaceholder = "assets/images/store_cover_placeholder_" + rand + ".jpg";
        // Reset avatar to make sure the view doesn't show the avatar of the previous user while the new one is loading
        this.updateView();

        // Bind the user model to this view
        this.stopListening();
        this.listenTo(this.store, "change", this.updateView);

        this.refreshChus();
        if (!this.store.chus.meta.total_count) {
            this.loadChus();
        }
        this.$.scroller.scrollToTop();
    },
    updateView: function() {
        this.$.name.setContent(this.store.get("name"));
        this.$.chusCount.setContent(this.store.get("chu_count") || 0);
        this.$.followButton.setContent(this.store.get("following") ? $L("unfollow") : $L("follow"));
        this.$.followersCount.setContent(this.store.get("follower_count") || 0);

        var coverImage = this.store.get("cover_image") || this.coverPlaceholder;
        this.$.avatar.setSrc(coverImage);

        var hasLocation = this.store.get("latitude") && this.store.get("longitude");

        if (hasLocation) {
            // Update location tile
            var url = "http://maps.googleapis.com/maps/api/staticmap?markers=" + this.store.get("latitude") + "," + this.store.get("longitude") + "&zoom=17&size=420x180&scale=1&sensor=false";
            this.$.locationTile.applyStyle("background-image", "url(" + url + ")");
        }

        this.$.locationBox.setShowing(hasLocation);
        this.$.mapButton.setDisabled(!hasLocation);

        this.updateInfoText();
    },
    updateInfoText: function() {
        var address = this.store.get("address") ? (this.store.get("address") + "<br>") : "";
        address += this.store.get("zip_code") ? (this.store.get("zip_code") + " ") : "";
        address += this.store.get("city") || "";
        this.$.address.setContent(address);
        this.$.addressSection.setShowing(address);
        this.$.phone.setContent(this.store.get("phone"));
        this.$.phoneSection.setShowing(this.store.get("phone"));
        this.$.website.setContent(this.store.get("website"));
        this.$.websiteSection.setShowing(this.store.get("website"));
        this.$.email.setContent(this.store.get("email"));
        this.$.emailSection.setShowing(this.store.get("email"));
        var openingHours = this.store.get("opening_hours") && this.store.get("opening_hours").replace(/\n/g, "<br>");
        this.$.openingHours.setContent(openingHours);
        this.$.openingHoursSection.setShowing(openingHours);
        var moreInfo = this.store.get("info") && this.store.get("info").replace(/\n/g, "<br>");
        this.$.moreInfo.setContent(moreInfo);
        this.$.moreInfoSection.setShowing(moreInfo);
    },
    loadChus: function() {
        this.$.chusEmpty.hide();
        this.$.chusSpinner.show();
        this.store.chus.fetch({data: {limit: 3, thumbnails: ["100x100"]}, success: enyo.bind(this, this.refreshChus)});
    },
    refreshChus: function() {
        this.$.chusSpinner.hide();
        this.$.chusRepeater.setCount(Math.min(this.store.chus.length, 3));
        this.$.chusEmpty.setShowing(!this.store.chus.length);
    },
    setupChu: function(sender, event) {
        var chu = this.store && this.store.chus.at(event.index);
        event.item.$.image.applyStyle("background-image", "url(" + chu.get("thumbnails")["100x100"] + ")");
    },
    chusTapped: function() {
        this.doShowChuList({chus: this.store.chus, title: $L("Chus at {{ name }}").replace("{{ name }}", this.store.get("name"))});
    },
    followersTapped: function() {
        this.doShowUserList({users: this.store.followers, title: $L("{{ name }}'s Followers").replace("{{ name }}", this.store.get("name"))});
    },
    followButtonTapped: function() {
        if (App.checkConnection()) {
            App.requireSignIn(enyo.bind(this, this.toggleFollow), "follow_store");
        }
    },
    toggleFollow: function(sender, event) {
        this.store.toggleFollow();
        App.sendCubeEvent("action", {
            type: "follow_store",
            result: this.store.get("following") ? "follow" : "unfollow",
            store: this.store.id,
            context: "profile"
        });
        return true;
    },
    showMap: function() {
        if (this.store.get("latitude") && this.store.get("longitude")) {
            this.$.panels.select(this.$.mapPanel, AnimatedPanels.SLIDE_IN_FROM_BOTTOM, AnimatedPanels.NONE);
            this.$.mapPanel.resized();
            this.setLocationMarker();
        }
    },
    hideMap: function() {
        this.$.panels.select(this.$.storePanel, AnimatedPanels.NONE, AnimatedPanels.SLIDE_OUT_TO_BOTTOM);
        this.$.storePanel.resized();
    },
    setLocationMarker: function() {
        //add marker
        var lat = this.store.get("latitude");
        var lng = this.store.get("longitude");
        var coords = {
            latitude: lat,
            longitude: lng
        };

        //add popup to marker
        var name = this.store.get("name");
        var address = this.store.get("address");
        var zipcode = this.store.get("zip_code");
        var city = this.store.get("city");
        if (address) {
            address = "<br>" + address;
        } if (zipcode) {
            zipcode = "<br>" + zipcode + ", ";
        } else if (city) {
            city = "<br>" + city;
        }
        var popup = "<strong>" + name + "</strong>" + "<span style='font-size: 14px'>" + (address || "") + (zipcode || "") + (city || "") + "</span>";

        this.$.map.clearMarkers();
        this.$.map.addMarker(coords, null, popup, null, true, null);

        this.$.map.setCenter(coords);
    },
    openPhone: function() {
        window.open("tel://" + this.store.get("phone"));
    },
    openEmail: function() {
        window.open("mailto://" + this.store.get("email"));
    },
    openWebsite: function() {
        window.open(this.store.get("website"), "_system");
    },
    showInfo: function() {
        var s = this.$.scroller.getStrategy();
        s.scrollTop = this.$.infoAncor.getBounds().top;
        s.start();
    },
    activate: function() {
        this.$.avatar.show();
        this.$.nameFollow.show();
        this.$.scroller.show();
        this.$.storePanel.resized();
        this.$.scroller.scrollToTop();
        this.positionParallaxElements();
    },
    deactivate: function() {
        this.$.avatar.hide();
        this.$.nameFollow.hide();
        this.$.scroller.hide();
    },
    positionParallaxElements: function() {
        this.$.avatar.applyStyle("-webkit-transform", "translate3d(0, " + -this.$.scroller.getScrollTop()/2 + "px, 0)");
        this.$.nameFollow.applyStyle("-webkit-transform", "translate3d(0, " + -this.$.scroller.getScrollTop()/1.5 + "px, 0)");
    },
    components: [
        {kind: "Image", classes: "userview-avatar fadein", name: "avatar"},
        {name: "nameFollow", classes: "userview-name-follow", components: [
            {kind: "Button", name: "followButton", content: $L("follow"), ontap: "followButtonTapped", classes: "userview-follow-button follow-button"},
            {classes: "userview-fullname ellipsis", name: "name"}
        ]},
        {kind: "AnimatedPanels", classes: "enyo-fill", name: "panels", components: [
            {kind: "FittableRows", name: "storePanel", components: [
                {classes: "header", components: [
                    {classes: "header-icon back", ontap: "doBack"}
                ]},
                {kind: "Scroller", fit: true, strategyKind: "TransitionScrollStrategy", preventScrollPropagation: false, onScroll: "positionParallaxElements", components: [
                    {classes: "userview-window", components: [
                        {style: "position: absolute; bottom: 0; right: 0; width: 100px; height: 50px;", ontap: "followButtonTapped"}
                    ]},
                    {style: "background-color: #f1f1f1", components: [
                        {classes: "userview-tabs", components: [
                            {kind: "Button", classes: "userview-tab", ontap: "chusTapped", components: [
                                {classes: "userview-tab-count", name: "chusCount", content: "0"},
                                {classes: "userview-tab-caption", content: $L("Chus")}
                            ]},
                            {kind: "Button", classes: "userview-tab", ontap: "followersTapped", components: [
                                {classes: "userview-tab-count", name: "followersCount", content: "0"},
                                {classes: "userview-tab-caption", content: $L("Followers")}
                            ]},
                            {kind: "Button", classes: "userview-tab", ontap: "showInfo", components: [
                                {classes: "storeview-tab-icon info"},
                                {classes: "userview-tab-caption", content: $L("Info")}
                            ]},
                            {kind: "Button", classes: "userview-tab", ontap: "showMap", name: "mapButton", components: [
                                {classes: "storeview-tab-icon map"},
                                {classes: "userview-tab-caption", content: $L("Map")}
                            ]}
                        ]},
                        {classes: "userview-box", name: "locationBox", ontap: "showMap", components: [
                            {classes: "userview-box-label stores"},
                            {classes: "userview-box-image storeview-location-tile", name: "locationTile"}
                        ]},
                        {classes: "userview-box", ontap: "chusTapped", components: [
                            {classes: "userview-box-label chus"},
                            {kind: "Repeater", style: "display: inline-block;", name: "chusRepeater", onSetupItem: "setupChu", components: [
                                {name: "image", classes: "userview-box-image"}
                            ]},
                            {kind: "Spinner", classes: "userview-box-spinner", name: "chusSpinner", showing: false},
                            {name: "chusEmpty", showing: false, classes: "userview-box-empty", content: $L("Nothing here yet...")}
                        ]},
                        {name: "infoAncor"},
                        {classes: "storeview-info-section", name: "addressSection", ontap: "showMap", components: [
                            {classes: "storeview-info-label", content: $L("Address")},
                            {classes: "storeview-info-text", name: "address", allowHtml: true}
                        ]},
                        {classes: "storeview-info-section", name: "phoneSection", ontap: "openPhone", components: [
                            {classes: "storeview-info-label", content: $L("Phone")},
                            {classes: "storeview-info-text", name: "phone"}
                        ]},
                        {classes: "storeview-info-section", name: "websiteSection", ontap: "openWebsite", components: [
                            {classes: "storeview-info-label", content: $L("Website")},
                            {classes: "storeview-info-text", name: "website"}
                        ]},
                        {classes: "storeview-info-section", name: "emailSection", ontap: "openEmail", components: [
                            {classes: "storeview-info-label", content: $L("Email")},
                            {classes: "storeview-info-text", name: "email"}
                        ]},
                        {classes: "storeview-info-section", name: "openingHoursSection", components: [
                            {classes: "storeview-info-label", content: $L("Opening hours")},
                            {classes: "storeview-info-text", name: "openingHours", allowHtml: true}
                        ]},
                        {classes: "storeview-info-section", name: "moreInfoSection", components: [
                            {classes: "storeview-info-label", content: $L("More info")},
                            {classes: "storeview-info-text", name: "moreInfo", allowHtml: true}
                        ]},
                        {style: "height: 5px;"}
                    ]}
                ]}
            ]},
            {kind: "FittableRows", name: "mapPanel", style: "z-index: 100", components: [
                {classes: "header", components: [
                    {kind: "Button", ontap: "hideMap", classes: "header-button right", content: $L("done")}
                ]},
                {kind: "Map", fit: true}
            ]}
        ]}
    ]
});