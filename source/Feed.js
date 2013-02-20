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
    create: function() {
        this.inherited(arguments);
        chuisy.feed.on("reset", this.feedLoaded, this);
        chuisy.feed.on("sync change remove", this.refreshFeed, this);
    },
    feedLoaded: function() {
        this.$.spinner.hide();
        this.$.feedList.setCount(chuisy.feed.length);
        if (this.pulled) {
            // Reloading feed was initialized by 'pull to refresh'. Refresh list via the _PulldownList.completePull_
            this.$.feedList.completePull();
        } else {
            this.$.feedList.reset();
        }
    },
    /**
        Refreshfeed based on the existing list.
    */
    refreshFeed: function() {
        this.$.feedList.setCount(chuisy.feed.length);
        this.$.feedList.refresh();
    },
    pullRelease: function() {
        if (App.isOnline()) {
            // Internet access available. Reload feed!
            this.pulled = true;
            chuisy.feed.fetch();
        } else {
            // No internet access don't reload
            this.$.feedList.completePull();
        }
    },
    pullComplete: function() {
        this.pulled = false;
        this.$.feedList.reset();
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
            chuisy.feed.fetchNext();
            this.$.loadingNextPage.show();
        } else {
            this.$.loadingNextPage.hide();
        }

        return true;
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
    components: [
        {kind: "onyx.Spinner", classes: "absolute-center"},
        {kind: "Signals", ononline: "online", onoffline: "offline", onSignInSuccess: "loadFeed", onSignOut: "loadFeed"},
        {classes: "post-chu-button", ontap: "doComposeChu"},
        {classes: "error-box", name: "errorBox", showing: false, components: [
            {classes: "error-text", content: $L("No internet connection available!")}
        ]},
        {kind: "PulldownList", fit: true, name: "feedList", onSetupItem: "setupFeedItem", rowsPerPage: 20, thumb: false, loadingIconClass: "puller-spinner",
            // pullingMessage: "", pulledMessage: "", loadingMessage: "", pullingIconClass: "", pulledIconClass: "", loadingIconClass: "",
            onPullRelease: "pullRelease", onPullComplete: "pullComplete", components: [
            {kind: "ChuFeedItem", tapHighlight: true, ontap: "chuTapped", onUserTapped: "userTapped"},
            {name: "loadingNextPage", content: $L("Loading..."), classes: "loading-next-page"}
        ]}
    ]
});