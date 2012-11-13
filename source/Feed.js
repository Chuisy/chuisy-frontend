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
        chuisy.chu.feed({}, enyo.bind(this, function(sender, response) {
            this.chus = response.objects;
            this.refreshFeed();
            this.$.spinner.hide();
        }));
    },
    refreshFeed: function() {
        this.$.feedList.setCount(this.chus.length);
        if (this.pulled) {
            this.$.feedList.completePull();
        } else {
            this.$.feedList.reset();
        }
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
        return true;
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
        {kind: "PulldownList", fit: true, name: "feedList", onSetupItem: "setupFeedItem", fixedHeight: false,
            ontap: "feedItemTapped", onPullRelease: "pullRelease", onPullComplete: "pullComplete", components: [
            {kind: "ChuFeedItem", tapHighlight: true, ontap: "chuTapped"}
        ]}
    ]
});