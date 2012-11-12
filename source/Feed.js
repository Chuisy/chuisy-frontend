enyo.kind({
    name: "Feed",
    classes: "feed",
    kind: "FittableRows",
    events: {
        onChuSelected: "",
        onItemClusterSelected: "",
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
        chuisy.feed({}, enyo.bind(this, function(sender, response) {
            this.feedItems = response.objects;
            this.refreshFeed();
            this.$.spinner.hide();
        }));
    },
    refreshFeed: function() {
        this.$.feedList.setCount(this.feedItems.length);
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
        var item = this.feedItems[event.index];

        switch (item.obj_type) {
            case "chu":
                this.$.listChu.setChu(item.obj);
                this.$.listChu.show();
                this.$.itemCluster.hide();
                break;
            case "item_cluster":
                this.$.itemCluster.setItems(item.obj.items);
                this.$.listChu.hide();
                this.$.itemCluster.show();
                break;
        }

        return true;
    },
    chuTapped: function(chu) {
        this.doChuSelected({chu: chu});
    },
    itemClusterTapped: function(items) {
        this.doItemClusterSelected({items: items});
    },
    feedItemTapped: function(sender, event) {
        var item = this.feedItems[event.index];

        switch (item.obj_type) {
            case "chu":
                this.chuTapped(item.obj);
                break;
            case "item_cluster":
                this.itemClusterTapped(item.obj.items);
                break;
        }
    },
    online: function() {
        this.$.errorBox.hide();
    },
    offline: function() {
        this.$.errorBox.show();
    },
    components: [
        {kind: "onyx.Spinner", classes: "onyx-light absolute-center"},
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
            {kind: "ListChu", tapHighlight: true},
            {kind: "ItemCluster", tapHighlight: true}
        ]},
        {kind: "Slideable", overMoving: false, unit: "px", min: -330, max: 0, classes: "secondarypanels shadow-left"},
        {kind: "Signals", onUserChanged: "userChanged", online: "online", onoffline: "offline"}
    ]
});