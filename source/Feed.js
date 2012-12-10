enyo.kind({
    name: "Feed",
    classes: "feed",
    kind: "FittableRows",
    events: {
        onShowChu: "",
        onToggleMenu: "",
        onComposeChu: "",
        onShowProfile: "",
        onShowNotifications: ""
    },
    meta: {
        limit: 20,
        offset: 0,
        total_count: 0
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
        chuisy.chu.feed({limit: 20}, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.chus = response.objects;
            this.feedLoaded();
            this.$.spinner.hide();
        }));
    },
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
        return this.meta.offset + this.meta.limit >= this.meta.total_count;
    },
    chuTapped: function(sender, event) {
        this.doShowChu({chu: this.chus[event.index]});
        event.preventDefault();
    },
    online: function() {
        this.$.errorBox.hide();
        this.loadFeed();
        return true;
    },
    offline: function() {
        this.$.errorBox.show();
        return true;
    },
    userTapped: function(sender, event) {
        this.doShowProfile({user: this.chus[event.index].user});
    },
    notificationsUpdated: function(sender, event) {
        this.$.notificationBadge.setContent(event.unread_count);
        this.$.notificationBadge.setShowing(event.unread_count);
        return true;
    },
    components: [
        {kind: "onyx.Spinner", classes: "onyx-light absolute-center"},
        {kind: "Slideable", overMoving: false, unit: "px", min: -330, max: 0, classes: "secondarypanels shadow-left"},
        {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onSignInSuccess: "loadFeed", onSignOut: "loadFeed", onNotificationsUpdated: "notificationsUpdated"},
        {classes: "post-chu-button", ontap: "doComposeChu"},
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {classes: "menu-button-icon"}
            ]},
            {classes: "mainheader-logo"},
            {kind: "onyx.Button", classes: "notification-button", ontap: "doShowNotifications", components: [
                {classes: "notification-button-icon"},
                {classes: "notification-button-badge", name: "notificationBadge", content: "0", showing: false}
            ]}
        ]},
        {classes: "error-box", name: "errorBox", showing: false, components: [
            {classes: "error-text", content: "No internet connection available!"}
        ]},
        {kind: "PulldownList", fit: true, name: "feedList", onSetupItem: "setupFeedItem", rowsPerPage: 20,
            pullingMessage: "", pulledMessage: "", loadingMessage: "", pullingIconClass: "", pulledIconClass: "", loadingIconClass: "",
            ontap: "feedItemTapped", onPullRelease: "pullRelease", onPullComplete: "pullComplete", components: [
            {kind: "ChuFeedItem", tapHighlight: true, ontap: "chuTapped", onUserTapped: "userTapped"},
            {name: "loadingNextPage", content: "Loading...", classes: "feed-nextpage"}
        ]}
    ]
});