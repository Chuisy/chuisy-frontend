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
    handlers: {
        onflick: "flick"
    },
    scrollerOffset: 35,
    pullerHeight: 50,
    pullerThreshold: 60,
    create: function() {
        this.inherited(arguments);
        chuisy.feed.on("reset", this.feedLoaded, this);
        chuisy.feed.on("remove", this.refreshFeed, this);
        // chuisy.feed.on("add", this.preloadImage, this);
        this.setPulled(true);
    },
    feedLoaded: function() {
        this.notice = chuisy.notices && chuisy.notices.filter(function(notice) {
            return !localStorage.getItem("chuisy.dismissed_notices." + notice.get("key"));
        })[0];
        this.$.feedList.setCount(chuisy.feed.length);
        this.setPulled(!chuisy.feed.length);
        if (this.hasNode()) {
            enyo.asyncMethod(this, function() {
                this.$.feedList.reset();
                this.$.feedList.setScrollTop(-this.scrollerOffset);
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
        App.sendCubeEvent("impression", {
            chu: item,
            context: "feed"
        });

        var isLastItem = event.index == chuisy.feed.length-1;
        var hasNextPage = chuisy.feed.hasNextPage();
        this.$.nextPageSpacer.setShowing(isLastItem && hasNextPage);
        this.$.lastPageMarker.setShowing(isLastItem && !hasNextPage);
        if (isLastItem && hasNextPage) {
            this.nextPage();
        }

        if (this.notice && event.index === 0) {
            this.$.feedInfoText.setContent(this.notice.get("text"));
            this.$.feedInfoBox.show();
        } else {
            this.$.feedInfoBox.hide();
        }

        return true;
    },
    nextPage: function() {
        if (!this.loading) {
            this.loading = true;
            this.$.nextPageSpinner.setSpinning(true);
            this.$.nextPageSpinner.addClass("rise");
            chuisy.feed.fetchNext({remote: true, success: enyo.bind(this, function() {
                this.loading = false;
                this.$.nextPageSpinner.setSpinning(false);
                this.$.nextPageSpinner.removeClass("rise");
                this.refreshFeed();
            }), error: enyo.bind(this, function() {
                this.loading = false;
                this.$.nextPageSpinner.setSpinning(false);
                this.$.nextPageSpinner.removeClass("rise");
            })});
        }
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
            this.$.feedList.setCount(chuisy.feed.length);
            this.$.feedList.reset();
        }
    },
    scrollHandler: function() {
        var scrollTop = this.$.feedList.getScrollTop();
        if (scrollTop < 0) {
            this.$.tabs.removeClass("hide");
            var offset = scrollTop + this.pullerHeight + this.scrollerOffset;
            var opacity = 1 - offset/this.pullerHeight;
            this.$.pulldown.applyStyle("opacity", opacity);
            this.pulling = scrollTop+this.scrollerOffset < -this.pullerThreshold;
            this.$.pulldown.addRemoveClass("pulling", this.pulling);
            this.$.feedList.getStrategy().topBoundary = this.pulling || this.pulled ? -this.scrollerOffset-this.pullerHeight : -this.scrollerOffset;
        }
    },
    dragFinishHandler: function() {
        if (this.pulling && !this.pulled) {
            chuisy.feed.fetch({remote: true});
        }
        this.setPulled(this.pulling || this.pulled);
    },
    setPulled: function(pulled) {
        this.pulled = pulled;
        this.$.pulldownSpinner.setSpinning(this.pulled);
        this.$.pulldown.addRemoveClass("pulled", this.pulled);
        this.$.pulldown.applyStyle("opacity", this.pulled ? 1 : 0);
        this.$.feedList.getStrategy().topBoundary = this.pulled ? -this.scrollerOffset-this.pullerHeight : -this.scrollerOffset;
        this.$.feedList.getStrategy().start();
    },
    unfreeze: function() {
        this.$.feedList.updateMetrics();
        this.$.feedList.refresh();
    },
    // generatePage: function(sender, event) {
    //     // var startIndex = (event.pageNumber - 2) * this.$.feedList.getRowsPerPage();
    //     enyo.asyncMethod(this, function() {
    //         var rows = this.$.feedList.getRowsPerPage();
    //         var startIndex = event.pageNumber * rows;

    //         var chus = chuisy.feed.slice(startIndex, startIndex + rows);
    //         for (var i=0; i<chus.length; i++) {
    //             App.sendCubeEvent("impression", {
    //                 chu: chus[i],
    //                 context: "feed"
    //             });
    //         }
    //     });
    // },
    dismissNotice: function() {
        App.sendCubeEvent("dismiss_notice", {
            context: "feed",
            notice: this.notice
        });
        localStorage.setItem("chuisy.dismissed_notices." + this.notice.get("key"), true);
        this.notice = null;
        this.feedLoaded();
    },
    confirmNotice: function() {
        this.doNoticeConfirmed({notice: this.notice});

        App.sendCubeEvent("confirm_notice", {
            context: "feed",
            notice: this.notice
        });
    },
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
        App.sendCubeEvent(chu.get("liked") ? "like" : "unlike", {
            chu: chu,
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
        this.$.tabs.addRemoveClass("hide", event.yVelocity < 0);
    },
    components: [
        {kind: "Heart", classes: "absolute-center"},
        {kind: "Spinner", name: "nextPageSpinner", classes: "next-page-spinner", spinning: false},
        {kind: "Signals", ononline: "online", onoffline: "offline", onSignInSuccess: "loadFeed", onSignOut: "loadFeed"},
        {classes: "post-chu-button", ontap: "doComposeChu"},
        {name: "tabs", classes: "feed-tabs", components: [
            {kind: "Button", classes: "feed-tab", ontap: "nearbyTapped", components: [
                {classes: "feed-tab-caption", content: $L("Nearby")}
            ]},
            {kind: "Button", classes: "feed-tab", ontap: "popularTapped", components: [
                {classes: "feed-tab-caption", content: $L("Popular")}
            ]},
            {kind: "Button", classes: "feed-tab", ontap: "discoverStoresTapped", components: [
                {classes: "feed-tab-caption", content: $L("Stores")}
            ]},
            {kind: "Button", classes: "feed-tab", ontap: "discoverUsersTapped", components: [
                {classes: "feed-tab-caption", content: $L("People")}
            ]}
        ]},
        {classes: "alert error", name: "noInternet", content: $L("No internet connection available!")},
        {name: "pulldown", style: "top: 35px;", classes: "pulldown", components: [
            {classes: "pulldown-arrow"},
            {kind: "Spinner", name: "pulldownSpinner", classes: "pulldown-spinner", spinning: false}
        ]},
        {kind: "List", classes: "enyo-fill", name: "feedList", onSetupItem: "setupFeedItem", rowsPerPage: 5, thumb: false, noSelect: true,
            loadingIconClass: "puller-spinner", strategyKind: "TransitionScrollStrategy",
            preventDragPropagation: false, ondrag: "dragHandler", ondragfinish: "dragFinishHandler", preventScrollPropagation: false, onScroll: "scrollHandler", components: [
            {name: "feedInfoBox", classes: "feed-info-box", components: [
                {name: "feedInfoText", classes: "feed-info-box-text"},
                {kind: "Button", content: $L("No Thanks"), classes: "feed-info-box-button dismiss", ontap: "dismissNotice"},
                {kind: "Button", content: $L("Let's Go"), classes: "feed-info-box-button confirm", ontap: "confirmNotice"}
            ]},
            {kind: "ChuFeedItem", tapHighlight: false, ontap: "chuTapped", onUserTapped: "userTapped", onToggleLike: "toggleLike", onStoreTapped: "storeTapped"},
            {name: "nextPageSpacer", classes: "next-page-spacer"},
            {name: "lastPageMarker", classes: "last-page-marker"}
        ]}
    ]
});