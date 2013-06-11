enyo.kind({
    name: "UserView",
    classes: "userview",
    kind: "FittableRows",
    published: {
        user: null
    },
    events: {
        onBack: "",
        onShowChuList: "",
        onShowUserList: "",
        onShowStoreList: ""
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    userChanged: function() {
        // Reset avatar to make sure the view doesn't show the avatar of the previous user while the new one is loading
        this.$.avatarWindow.applyStyle("background-image", "url()");
        this.updateView();

        // Bind the user model to this view
        this.stopListening();
        this.listenTo(this.user, "change", this.updateView);

        // Refresh collections associated with this user. Fetch from server if necessary
        this.refreshHearts();
        if (!this.user.likedChus.meta.total_count) {
            this.user.likedChus.fetch({data: {limit: 3, thumbnails: ["100x100"]}, success: enyo.bind(this, this.refreshHearts)});
        }
        this.refreshChus();
        if (!this.user.chus.length.total_count) {
            this.user.chus.fetch({data: {limit: 3, thumbnails: ["100x100"]}, success: enyo.bind(this, this.refreshChus)});
        }
        this.refreshGoodies();
        if (!this.user.goodies.meta.total_count) {
            this.user.goodies.fetch({data: {limit: 3}, success: enyo.bind(this, this.refreshGoodies)});
        }
        this.refreshStores();
        if (!this.user.followedStores.length.total_count) {
            this.user.followedStores.fetch({data: {limit: 3}, success: enyo.bind(this, this.refreshStores)});
        }
    },
    updateView: function() {
        this.$.fullName.setContent(this.user ? this.user.getFullName() : "");
        this.$.avatarWindow.applyStyle("background-image", "url(" + this.user.profile.get("avatar") + ")");
        this.$.heartsCount.setContent(this.user.get("like_count") || 0);
        this.$.chusCount.setContent(this.user.get("chu_count") || 0);
        this.$.followersCount.setContent(this.user.get("follower_count") || 0);
        this.$.followingCount.setContent(this.user.get("following_count") || 0);

        // Hide the follow button if the shown user is identical to the current active user
        var activeUser = chuisy.accounts.getActiveUser();
        this.$.followButton.setShowing(!activeUser || this.user.id != activeUser.id);

        this.$.followButton.setContent(this.user.get("following") ? $L("unfollow") : $L("follow"));
    },
    refreshHearts: function() {
        this.$.heartsRepeater.setCount(Math.min(this.user.likedChus.length, 3));
    },
    setupHeart: function(sender, event) {
        var heart = this.user && this.user.likedChus.at(event.index);
        event.item.$.image.applyStyle("background-image", "url(" + heart.get("thumbnails")["100x100"] + ")");
    },
    refreshChus: function() {
        this.$.chusRepeater.setCount(Math.min(this.user.chus.length, 3));
    },
    setupChu: function(sender, event) {
        var chu = this.user && this.user.chus.at(event.index);
        event.item.$.image.applyStyle("background-image", "url(" + chu.get("thumbnails")["100x100"] + ")");
    },
    refreshGoodies: function() {
        this.$.goodiesRepeater.setCount(Math.min(this.user.goodies.length, 3));
    },
    setupGoody: function(sender, event) {
        var goody = this.user && this.user.goodies.at(event.index);
        event.item.$.image.applyStyle("background-image", "url(" + goody.get("cover_image_thumbnail") + ")");
    },
    refreshStores: function() {
        this.$.storesRepeater.setCount(Math.min(this.user.followedStores.length, 3));
    },
    setupStore: function(sender, event) {
        var store = this.user && this.user.followedStores.at(event.index);
        var rand = Math.ceil(Math.random()*2);
        var coverPlaceholder = "assets/images/store_cover_placeholder_" + rand + ".jpg";
        event.item.$.image.applyStyle("background-image", "url(" + (store.get("cover_image") || coverPlaceholder) + ")");
        event.item.$.storeName.setContent(store.get("name"));
    },
    activate: function(obj) {
        this.setUser(obj);
        this.$.scroller.scrollToTop();
    },
    deactivate: function() {
    },
    heartsTapped: function() {
        this.doShowChuList({chus: this.user.likedChus, title: this.user.get("first_name") + "'s Hearts"});
    },
    chusTapped: function() {
        this.doShowChuList({chus: this.user.chus, title: this.user.get("first_name") + "'s Chus"});
    },
    followersTapped: function() {
        this.doShowUserList({users: this.user.followers});
    },
    followingTapped: function() {
        this.doShowUserList({users: this.user.following});
    },
    storesTapped: function() {
        this.doShowStoreList({stores: this.user.followedStores});
    },
    followButtonTapped: function() {
        if (App.checkConnection()) {
            App.requireSignIn(enyo.bind(this, this.toggleFollow), "follow");
        }
    },
    toggleFollow: function(sender, event) {
        this.user.toggleFollow();
        App.sendCubeEvent(this.user.get("following") ? "follow" : "unfollow", {
            target_user: this.user,
            context: "profile"
        });
        return true;
    },
    components: [
        {classes: "header", components: [
            {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")}
        ]},
        {kind: "Scroller", fit: true, strategyKind: "TransitionScrollStrategy", components: [
            {classes: "userview-window", name: "avatarWindow", components: [
                {classes: "userview-fullname", name: "fullName"},
                {kind: "Button", name: "followButton", content: "follow", ontap: "followButtonTapped", classes: "userview-follow-button follow-button"}
            ]},
            {classes: "userview-tabs", components: [
                {kind: "Button", classes: "userview-tab", ontap: "heartsTapped", components: [
                    {classes: "userview-tab-count", name: "heartsCount", content: "0"},
                    {classes: "userview-tab-caption", content: $L("Hearts")}
                ]},
                {kind: "Button", classes: "userview-tab", ontap: "chusTapped", components: [
                    {classes: "userview-tab-count", name: "chusCount", content: "0"},
                    {classes: "userview-tab-caption", content: $L("Chus")}
                ]},
                {kind: "Button", classes: "userview-tab", ontap: "followersTapped", components: [
                    {classes: "userview-tab-count", name: "followersCount", content: "0"},
                    {classes: "userview-tab-caption", content: $L("Followers")}
                ]},
                {kind: "Button", classes: "userview-tab", ontap: "followingTapped", components: [
                    {classes: "userview-tab-count", name: "followingCount", content: "0"},
                    {classes: "userview-tab-caption", content: $L("Following")}
                ]}
            ]},
            {classes: "userview-box", ontap: "heartsTapped", components: [
                {classes: "userview-box-label hearts"},
                {kind: "Repeater", style: "display: inline-block;", name: "heartsRepeater", onSetupItem: "setupHeart", components: [
                    {name: "image", classes: "userview-box-image"}
                ]}
            ]},
            {classes: "userview-box", ontap: "chusTapped", components: [
                {classes: "userview-box-label chus"},
                {kind: "Repeater", style: "display: inline-block;", name: "chusRepeater", onSetupItem: "setupChu", components: [
                    {name: "image", classes: "userview-box-image"}
                ]}
            ]},
            // {classes: "userview-box followers", components: [
            //     {kind: "Button", classes: "userview-followers-button", allowHtml: true, content: "<strong>21</strong> people follow Martin"},
            //     {kind: "Button", classes: "userview-followers-button", allowHtml: true, content: "Martin follows <strong>5</strong> people"}
            // ]},
            {classes: "userview-box", ontap: "goodiesTapped", components: [
                {classes: "userview-box-label goodies"},
                {kind: "Repeater", style: "display: inline-block;", name: "goodiesRepeater", onSetupItem: "setupGoody", components: [
                    {name: "image", classes: "userview-box-image"}
                ]}
            ]},
            {classes: "userview-box", ontap: "storesTapped", components: [
                {classes: "userview-box-label stores"},
                {kind: "Repeater", style: "display: inline-block;", name: "storesRepeater", onSetupItem: "setupStore", components: [
                    {name: "image", classes: "userview-box-image", components: [
                        {classes: "userview-store-name ellipsis", name: "storeName"}
                    ]}
                ]}
            ]},
            {style: "height: 5px;"}
        ]}
    ]
});