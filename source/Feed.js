enyo.kind({
    name: "Feed",
    classes: "feed",
    kind: "FittableRows",
    events: {
        onChuSelected: "",
        onToggleMenu: ""
    },
    userChanged: function(sender, event) {
        if (!this.authUser || this.authUser.id != event.user.id) {
            this.authUser = event.user;
            this.loadFeed();
        }
    },
    loadFeed: function() {
        if (!this.pulled) {
            this.$.spinner.show();
        }
        chuisy.feed.load({limit: 20}, enyo.bind(this, function(items) {
            this.chus = items;
            this.feedLoaded();
            this.$.spinner.hide();
        }));
    },
    nextPage: function() {
        chuisy.feed.nextPage(enyo.bind(this, function(items) {
            this.chus = this.chus.concat(items);
            this.refreshFeed();
        }));
    },
    feedLoaded: function() {
        this.$.feedList.setCount(this.chus.length);
        if (this.pulled) {
            this.$.feedList.completePull();
        } else {
            this.$.feedList.reset();
        }
    },
    refreshFeed: function() {
        this.$.feedList.setCount(this.chus.length);
        this.$.feedList.refresh();
    },
    pullRelease: function() {
        if (App.isOnline()) {
            this.pulled = true;
            this.loadFeed();
        } else {
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
            this.nextPage();
            this.$.loadingNextPage.show();
        } else {
            this.$.loadingNextPage.hide();
        }

        return true;
    },
    allPagesLoaded: function() {
        return chuisy.feed.allPagesLoaded();
    },
    chuTapped: function(sender, event) {
        this.doChuSelected({chu: this.chus[event.index]});
    },
    online: function() {
        this.$.errorBox.hide();
    },
    offline: function() {
        this.$.errorBox.show();
    },
    components: [
        {kind: "onyx.Spinner", classes: "onyx-light absolute-center"},
        {kind: "Slideable", overMoving: false, unit: "px", min: -330, max: 0, classes: "secondarypanels shadow-left"},
        {kind: "Signals", onUserChanged: "userChanged", online: "online", onoffline: "offline"},
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {classes: "mainheader-text", content: "chuisy"}
        ]},
        {classes: "error-box", name: "errorBox", showing: false, components: [
            {classes: "error-text", content: "No internet connection available!"}
        ]},
        {kind: "PulldownList", fit: true, name: "feedList", onSetupItem: "setupFeedItem", rowsPerPage: 20,
            ontap: "feedItemTapped", onPullRelease: "pullRelease", onPullComplete: "pullComplete", components: [
            {kind: "ChuFeedItem", tapHighlight: true, ontap: "chuTapped"},
            {name: "loadingNextPage", content: "Loading...", classes: "feed-nextpage"}
        ]}
    ]
});