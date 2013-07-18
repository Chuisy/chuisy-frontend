enyo.kind({
    name:"ex.List",
    kind:"enyo.List",
    events:{
        onGeneratePage:""
    },
    generatePage:function(inPageNo, inTarget) {
        this.inherited(arguments);
        this.doGeneratePage({pageNumber: inPageNo});
        // var n = inTarget.hasNode();
        // if(n) {
        //     enyo.forEach(n.querySelectorAll("IMG"), function(img) {
        //         img.style.opacity = 0;
        //         enyo.dispatcher.listen(img, "load", function() {
        //             img.style["-webkit-animation"] = "fadein 0.5s";
        //             img.style.opacity = 1;
        //         });
        //     });
        // }
    }
});

/**
    _Feed_ displays chus from people the user follows and other public chus.
*/
enyo.kind({
    name: "Feed",
    kind: "FittableRows",
    classes: "feed",
    events: {
        // User has tapped a chu
        onShowChu: "",
        // User has tapped the plus button
        onComposeChu: "",
        // User has tapped the avatar or name of a user
        onShowUser: "",
        onNoticeConfirmed: "",
        onShowDiscoverChus: "",
        onShowDiscoverStores: "",
        onShowDiscoverUsers: "",
        onShowNearby: "",
        onShowStore: ""
    },
    scrollerOffset: 35,
    pullerHeight: 50,
    pullerThreshold: 60,
    create: function() {
        this.inherited(arguments);
        // chuisy.feed.on("reset", this.feedLoaded, this);
        // chuisy.feed.on("remove", this.refreshFeed, this);
        var s = this.$.feedList.getStrategy();
        s.scrollIntervalMS = 17;
        chuisy.accounts.on("change:active_user", this.activeUserChanged, this);
    },
    activeUserChanged: function() {
        setTimeout(enyo.bind(this, this.fetchFeed, true), chuisy.feed.meta.total_count ? 1000 : 50);
    },
    fetchFeed: function(direct) {
        this.$.placeholder.hide();
        this.setPulled(true, direct);
        chuisy.feed.fetch({data: {
            thumbnails: ["292x292"]
        }, success: enyo.bind(this, function() {
            this.setPulled(false, direct);
            this.feedLoaded();
        }), error: enyo.bind(this, function() {
            this.setPulled(false, direct);
        })});
    },
    nextPage: function() {
        if (!this.loading) {
            this.loading = true;
            chuisy.feed.fetchNext({data: {
                thumbnails: ["292x292"]
            }, success: enyo.bind(this, function() {
                this.loading = false;
                this.refreshFeed();
            }), error: enyo.bind(this, function() {
                this.loading = false;
            })});
        }
    },
    feedLoaded: function() {
        // this.notice = chuisy.notices && chuisy.notices.filter(function(notice) {
        //     return !localStorage.getItem("chuisy.dismissed_notices." + notice.get("key"));
        // })[0];
        this.$.feedList.setCount(chuisy.feed.length);
        this.$.placeholder.setShowing(!chuisy.feed.length);
        if (this.hasNode()) {
            enyo.asyncMethod(this, function() {
                this.$.feedList.reset();
                this.$.feedList.setScrollTop(-this.scrollerOffset);
                this.$.tabs.removeClass("hide");
            });
        }
    },
    /**
        Refreshfeed based on the existing list.
    */
    refreshFeed: function() {
        this.$.feedList.setCount(chuisy.feed.length);
        this.$.feedList.refresh();
    },
    preloadImage: function(model, coll, options) {
        var img = new Image();
        img.src = model.get("thumbnails")["300x300"];
    },
    setupFeedItem: function(sender, event) {
        var item = chuisy.feed.at(event.index);
        this.$.chuFeedItem.setChu(item);
        this.$.chuFeedItem.update();

        // this.$.chuFeedItem.removeClass("feed-item-added");
        // if (item.added) {
        // this.$.chuFeedItem.applyStyle("-webkit-transition", "none");
        // this.$.chuFeedItem.applyStyle("-webkit-transform", "rotateX(90deg)");
        // enyo.asyncMethod(this, function(index) {
        //     this.$.feedList.performOnRow(index, function() {
        //         // this.$.chuFeedItem.addClass("feed-item-added");
        //         this.$.chuFeedItem.applyStyle("-webkit-transition", "-webkit-transform 0.5s");
        //         this.$.chuFeedItem.applyStyle("-webkit-transform", "rotateX(0deg)");
        //     }, this);
        // }, event.index);
        // } else {
        //     this.$.chuFeedItem.applyStyle("opacity", 1);
        // }
        // App.sendCubeEvent("impression", {
        //     chu: item,
        //     context: "feed"
        // });

        var isLastItem = event.index == chuisy.feed.length-1;
        var hasNextPage = chuisy.feed.hasNextPage();
        this.$.listItem.addRemoveClass("next-page", isLastItem && hasNextPage);
        this.$.listItem.addRemoveClass("last-item", isLastItem && !hasNextPage);
        if (isLastItem && hasNextPage) {
            this.nextPage();
        }

        // if (this.notice && event.index === 0) {
        //     this.$.feedInfoText.setContent(this.notice.get("text"));
        //     this.$.feedInfoBox.show();
        // } else {
        //     this.$.feedInfoBox.hide();
        // }

        return true;
    },
    chuTapped: function(sender, event) {
        if (!this.$.feedList.getStrategy().stoppedOnDown) {
            this.doShowChu({chu: chuisy.feed.at(event.index)});
        }
        event.preventDefault();
    },
    online: function() {
        this.$.noInternet.removeClass("show");
        this.$.tabs.removeClass("disabled");
        return true;
    },
    offline: function() {
        this.$.noInternet.addClass("show");
        this.$.tabs.addClass("disabled");
        return true;
    },
    userTapped: function(sender, event) {
        if (!this.$.feedList.getStrategy().stoppedOnDown) {
            var user = chuisy.feed.at(event.index).get("user");
            if (!user && !App.isSignedIn()) {
                enyo.Signals.send("onRequestSignIn", {context: "other"});
            } else if (user) {
                this.doShowUser({user: user});
            }
        }
    },
    addChu: function(newChu) {
        if (newChu) {
            newChu.added = true;
            chuisy.feed.add(newChu, {at: 0});
            this.feedLoaded();
        }
    },
    scrollHandler: function() {
        var scrollTop = this.$.feedList.getScrollTop();
        if (scrollTop < 0) {
            this.$.pulldown.show();
            this.$.tabs.removeClass("hide");
            var offset = scrollTop + this.pullerHeight + this.scrollerOffset;
            // var opacity = 1 - offset/this.pullerHeight;
            // this.$.pulldown.applyStyle("opacity", opacity);
            this.$.pulldown.applyStyle("-webkit-transform", "translate3d(0, " + Math.min(this.scrollerOffset + this.pullerHeight, -scrollTop) + "px, 0)");
            this.pulling = scrollTop+this.scrollerOffset < -this.pullerThreshold;
            this.$.pulldown.addRemoveClass("pulling", this.pulling);
            this.$.feedList.getStrategy().topBoundary = this.pulling || this.pulled ? -this.scrollerOffset-this.pullerHeight : -this.scrollerOffset;
        }
    },
    dragFinishHandler: function() {
        if (this.pulling && !this.pulled) {
            this.fetchFeed();
        }
        this.setPulled(this.pulling || this.pulled);
    },
    setPulled: function(pulled, direct) {
        this.pulled = pulled;
        this.$.pulldown.setShowing(this.pulled);
        this.$.pulldownSpinner.setSpinning(this.pulled);
        this.$.pulldown.addRemoveClass("pulled", this.pulled);
        this.$.feedList.getStrategy().topBoundary = this.pulled ? -this.scrollerOffset-this.pullerHeight : -this.scrollerOffset;
        this.$.pulldown.applyStyle("-webkit-transform", "translate3d(0, " + (this.pulled ? this.scrollerOffset + this.pullerHeight : 0)+ "px, 0)");
        if (direct) {
            this.$.feedList.setScrollTop(this.pulled ? -this.scrollerOffset-this.pullerHeight : -this.scrollerOffset);
        }
    },
    // dismissNotice: function() {
    //     App.sendCubeEvent("dismiss_notice", {
    //         context: "feed",
    //         notice: this.notice
    //     });
    //     localStorage.setItem("chuisy.dismissed_notices." + this.notice.get("key"), true);
    //     this.notice = null;
    //     this.feedLoaded();
    // },
    // confirmNotice: function() {
    //     this.doNoticeConfirmed({notice: this.notice});

    //     App.sendCubeEvent("confirm_notice", {
    //         context: "feed",
    //         notice: this.notice
    //     });
    // },
    nearbyTapped: function() {
        this.doShowNearby();
        event.preventDefault();
        return true;
    },
    discoverStoresTapped: function() {
        this.doShowDiscoverStores();
        event.preventDefault();
        return true;
    },
    discoverUsersTapped: function() {
        this.doShowDiscoverUsers();
        event.preventDefault();
        return true;
    },
    popularTapped: function() {
        this.doShowDiscoverChus();
        event.preventDefault();
        return true;
    },
    toggleLike: function(sender, event) {
        var chu = chuisy.feed.at(event.index);
        chu.toggleLike();
        this.$.feedList.renderRow(event.index);
        if (chu.get("liked")) {
            this.$.heart.animate();
        }
        App.sendCubeEvent("action", {
            type: "like",
            result: chu.get("liked") ? "like" : "unlike",
            chu: {
                id: chu.id,
                user: chu.get("user").id
            },
            context: "feed"
        });
        return true;
    },
    storeTapped: function(sender, event) {
        if (!this.$.feedList.getStrategy().stoppedOnDown) {
            var chu = chuisy.feed.at(event.index);
            this.doShowStore({store: chu.get("store")});
        }
        return true;
    },
    flick: function(sender, event) {
        var self = this;
        setTimeout(function() {
            self.$.tabs.addRemoveClass("hide", event.yVelocity < 0);
        }, 100);
    },
    components: [
        {kind: "Heart", classes: "absolute-center"},
        {kind: "Signals", ononline: "online", onoffline: "offline", onSignInSuccess: "loadFeed", onSignOut: "loadFeed"},
        {classes: "post-chu-button", ontap: "doComposeChu"},
        {name: "tabs", classes: "feed-tabs", components: [
            {kind: "Button", classes: "feed-tab", ontap: "nearbyTapped", components: [
                {classes: "feed-tab-icon nearby"},
                {classes: "feed-tab-caption", content: $L("Nearby")}
            ]},
            {kind: "Button", classes: "feed-tab", ontap: "popularTapped", components: [
                {classes: "feed-tab-icon discover"},
                {classes: "feed-tab-caption", content: $L("Discover")}
            ]},
            {kind: "Button", classes: "feed-tab", ontap: "discoverStoresTapped", components: [
                {classes: "feed-tab-icon stores"},
                {classes: "feed-tab-caption", content: $L("Stores")}
            ]},
            {kind: "Button", classes: "feed-tab", ontap: "discoverUsersTapped", components: [
                {classes: "feed-tab-icon people"},
                {classes: "feed-tab-caption", content: $L("People")}
            ]}
        ]},
        {classes: "alert error", name: "noInternet", content: $L("No internet connection available!")},
        {name: "pulldown", showing: false, classes: "pulldown", components: [
            {classes: "pulldown-arrow"},
            {kind: "Spinner", name: "pulldownSpinner", classes: "pulldown-spinner", spinning: false}
        ]},
        {classes: "placeholder", showing: true, name: "placeholder", components: [
            {classes: "placeholder-image"},
            {classes: "placeholder-text", content: $L("There is nothing here to see! Maybe you are not following any people or stores yet?")},
            {kind: "Button", classes: "feed-placeholder-button", content: $L("Start discovering"), ontap: "doShowDiscoverChus"}
        ]},
        {kind: "List", classes: "enyo-fill fadein", name: "feedList", onSetupItem: "setupFeedItem", rowsPerPage: 5, thumb: false, noSelect: true,
            loadingIconClass: "puller-spinner", strategyKind: "TransitionScrollStrategy",
            preventDragPropagation: false, ondragfinish: "dragFinishHandler", preventScrollPropagation: false, onScroll: "scrollHandler", onflick: "flick", components: [
            {name: "listItem", classes: "list-item-wrapper", attributes: {"data-next-page": $L("Wait, there's more!")}, components: [
                // {name: "feedInfoBox", classes: "feed-info-box", components: [
                //     {name: "feedInfoText", classes: "feed-info-box-text"},
                //     {kind: "Button", content: $L("No Thanks"), classes: "feed-info-box-button dismiss", ontap: "dismissNotice"},
                //     {kind: "Button", content: $L("Let's Go"), classes: "feed-info-box-button confirm", ontap: "confirmNotice"}
                // ]},
                {kind: "ChuFeedItem", tapHighlight: false, ontap: "chuTapped", onUserTapped: "userTapped", onToggleLike: "toggleLike", onStoreTapped: "storeTapped"}
                // {kind: "Spinner", name: "nextPageSpinner", classes: "next-page-spinner"}
                // {name: "lastPageMarker", classes: "last-page-marker"}
            ]}
        ]}
    ]
});