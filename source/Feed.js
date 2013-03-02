/**
    _Feed_ displays chus from people the user follows and other public chus.
*/
enyo.kind({
    name: "Feed",
    classes: "feed",
    kind: "FittableRows",
    events: {
        // User has tapped a chu
        onShowChu: "",
        // User has tapped the plus button
        onComposeChu: "",
        // User has tapped the avatar or name of a user
        onShowUser: ""
    },
    handlers: {
        onpostresize: "unfreeze"
    },
    create: function() {
        this.inherited(arguments);
        chuisy.feed.on("reset", this.feedLoaded, this);
        chuisy.feed.on("sync change remove", this.refreshFeed, this);
        this.pullerHeight = 50;
        this.pullerThreshold = 80;
    },
    feedLoaded: function() {
        this.$.spinner.setShowing(!chuisy.feed.length);
        this.$.feedList.setCount(chuisy.feed.length);
        this.$.feedList.getStrategy().scrollTop = 0;
        this.setPulled(false);
        this.$.feedList.refresh();
    },
    /**
        Refreshfeed based on the existing list.
    */
    refreshFeed: function() {
        this.$.feedList.setCount(chuisy.feed.length);
        this.$.feedList.refresh();
    },
    setupFeedItem: function(sender, event) {
        var item = chuisy.feed.at(event.index);
        this.$.chuFeedItem.setChu(item);

        this.$.chuFeedItem.removeClass("feed-item-added");
        if (item.added) {
            this.$.chuFeedItem.applyStyle("opacity", 0);
            enyo.asyncMethod(this, function(index) {
                this.$.feedList.performOnRow(index, function() {
                    this.$.chuFeedItem.addClass("feed-item-added");
                    this.$.chuFeedItem.applyStyle("opacity", 1);
                }, this);
            }, event.index);
        } else {
            this.$.chuFeedItem.applyStyle("opacity", 1);
        }

        var isLastItem = event.index == chuisy.feed.length-1;
        if (isLastItem && chuisy.feed.hasNextPage()) {
            // We are at the end of the list and there seems to be more.
            // Load next bunch of chus
            this.nextPage();
            this.$.loadingNextPage.show();
        } else {
            this.$.loadingNextPage.hide();
        }

        return true;
    },
    nextPage: function() {
        if (!this.loading) {
            this.loading = true;
            chuisy.feed.fetchNext({remote: true, success: enyo.bind(this, function() {
                this.loading = false;
                this.refreshFeed();
            }), error: enyo.bind(this, function() {
                this.loading = false;
            })});
        }
    },
    chuTapped: function(sender, event) {
        this.doShowChu({chu: chuisy.feed.at(event.index)});
        event.preventDefault();
    },
    online: function() {
        this.$.errorBox.hide();
        // this.loadFeed();
        return true;
    },
    offline: function() {
        this.$.errorBox.show();
        return true;
    },
    userTapped: function(sender, event) {
        var userJSON = chuisy.feed.at(event.index).get("user");
        if (!userJSON && !App.isSignedIn()) {
            enyo.Signals.send("onRequestSignIn");
        } else if (userJSON) {
            var user = new chuisy.models.User(userJSON);
            this.doShowUser({user: user});
        }
    },
    activate: function(newChu) {
        enyo.Signals.send("onShowGuide", {view: "feed"});
        this.newChu = newChu;
        if (newChu) {
            newChu.added = true;
            chuisy.feed.add(newChu, {at: 0});
            this.$.feedList.setCount(chuisy.feed.length);
            this.$.feedList.reset();
            enyo.asyncMethod(this, function() {
                newChu.added = false;
            });
        }
    },
    deactivate: function() {
        if (this.newChu) {
            this.newChu.added = false;
            this.newChu = null;
        }
    },
    scrollHandler: function() {
        var scrollTop = this.$.feedList.getScrollTop();
        var offset = scrollTop + this.pullerHeight;
        var opacity = 1 - offset/this.pullerHeight;
        this.$.pulldown.applyStyle("opacity", opacity);
        this.pulling = scrollTop < -this.pullerThreshold;
        this.$.pulldown.addRemoveClass("pulling", this.pulling);
        this.$.feedList.getStrategy().topBoundary = this.pulling || this.pulled ? -this.pullerHeight : 0;
    },
    dragFinishHandler: function() {
        if (this.pulling && !this.pulled) {
            chuisy.feed.fetch({remote: true});
        }
        this.setPulled(this.pulling || this.pulled);
    },
    setPulled: function(pulled) {
        this.pulled = pulled;
        this.$.pulldown.addRemoveClass("pulled", this.pulled);
        this.$.feedList.getStrategy().topBoundary = this.pulled ? -this.pullerHeight : 0;
        this.$.feedList.getStrategy().start();
    },
    unfreeze: function() {
        this.$.feedList.updateMetrics();
        this.$.feedList.refresh();
    },
    components: [
        {kind: "onyx.Spinner", classes: "absolute-center"},
        {kind: "Signals", ononline: "online", onoffline: "offline", onSignInSuccess: "loadFeed", onSignOut: "loadFeed"},
        {classes: "post-chu-button", ontap: "doComposeChu"},
        {classes: "error-box", name: "errorBox", showing: false, components: [
            {classes: "error-text", content: $L("No internet connection available!")}
        ]},
        {name: "pulldown", classes: "pulldown", components: [
            {classes: "pulldown-arrow"},
            {kind: "onyx.Spinner", classes: "pulldown-spinner"}
        ]},
        {kind: "List", fit: true, name: "feedList", onSetupItem: "setupFeedItem", rowsPerPage: 10, thumb: false,
            loadingIconClass: "puller-spinner", strategyKind: "TransitionScrollStrategy",
            preventDragPropagation: false, ondrag: "dragHandler", ondragfinish: "dragFinishHandler", preventScrollPropagation: false, onScroll: "scrollHandler", components: [
            {kind: "ChuFeedItem", tapHighlight: true, ontap: "chuTapped", onUserTapped: "userTapped"},
            {kind: "onyx.Spinner", name: "loadingNextPage", classes: "loading-next-page"}
        ]}
    ]
});