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
    meta: {
        limit: 20,
        offset: 0,
        total_count: 0
    },
    userChanged: function(sender, event) {
        if (!this.authUser || this.authUser.id != event.user.id) {
            // User has changed. Reload feed.
            this.authUser = event.user;
            // this.loadFeed();
        }
    },
    /**
        Loads the chu feed.
    */
    loadFeed: function() {
        if (!this.pulled) {
            this.$.spinner.show();
        }
        chuisy.chu.feed({limit: 20}, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.chus = response.objects;
            this.feedLoaded();
            this.$.spinner.hide();
        }));
    },
    /**
        Load the next page
    */
    nextPage: function() {
        var params = {
            limit: this.meta.limit,
            offset: this.meta.offset + this.meta.limit
        };
        chuisy.chu.feed(params, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.chus = this.chus.concat(response.objects);
            this.refreshFeed();
        }));
    },
    feedLoaded: function() {
        this.$.feedList.setCount(this.chus.length);
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
        this.$.feedList.setCount(this.chus.length);
        this.$.feedList.refresh();
    },
    pullRelease: function() {
        if (App.isOnline()) {
            // Internet access available. Reload feed!
            this.pulled = true;
            this.loadFeed();
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
        var item = this.chus[event.index];
        this.$.chuFeedItem.setChu(item);

        var isLastItem = event.index == this.chus.length-1;
        if (isLastItem && !this.allPagesLoaded()) {
            // We are at the end of the list and there seems to be more.
            // Load next bunch of chus
            this.nextPage();
            this.$.loadingNextPage.show();
        } else {
            this.$.loadingNextPage.hide();
        }

        return true;
    },
    /**
        Checks if all items have been loaded
    */
    allPagesLoaded: function() {
        return this.meta.offset + this.meta.limit >= this.meta.total_count;
    },
    chuTapped: function(sender, event) {
        this.doShowChu({chu: this.chus[event.index]});
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
        this.doShowUser({user: this.chus[event.index].user});
    },
    activate: function() {
        enyo.Signals.send("onShowGuide", {view: "feed"});
    },
    deactivate: function() {},
    components: [
        {kind: "onyx.Spinner", classes: "absolute-center"},
        {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onSignInSuccess: "loadFeed", onSignOut: "loadFeed"},
        {classes: "post-chu-button", ontap: "doComposeChu"},
        {classes: "error-box", name: "errorBox", showing: false, components: [
            {classes: "error-text", content: $L("No internet connection available!")}
        ]},
        {kind: "PulldownList", fit: true, name: "feedList", onSetupItem: "setupFeedItem", rowsPerPage: 20, thumb: false,
            // pullingMessage: "", pulledMessage: "", loadingMessage: "", pullingIconClass: "", pulledIconClass: "", loadingIconClass: "",
            ontap: "feedItemTapped", onPullRelease: "pullRelease", onPullComplete: "pullComplete", components: [
            {kind: "ChuFeedItem", tapHighlight: true, ontap: "chuTapped", onUserTapped: "userTapped"},
            {name: "loadingNextPage", content: $L("Loading..."), classes: "loading-next-page"}
        ]}
    ]
});