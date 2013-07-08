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
    create: function() {
        this.inherited(arguments);
        var s = this.$.scroller.getStrategy();
        s.scrollIntervalMS = 17;
    },
    userChanged: function() {
        // Reset avatar to make sure the view doesn't show the avatar of the previous user while the new one is loading
        this.updateView();

        // Bind the user model to this view
        this.stopListening();
        this.listenTo(this.user, "change", this.updateView);

        // Refresh collections associated with this user. Fetch from server if necessary
        this.refreshHearts();
        if (!this.user.likedChus.meta.total_count) {
            this.loadHearts();
        }
        this.refreshChus();
        if (!this.user.chus.meta.total_count) {
            this.loadChus();
        }
        this.refreshGoodies();
        if (!this.user.goodies.meta.total_count) {
            this.loadGoodies();
        }
        this.refreshStores();
        if (!this.user.followedStores.length.total_count) {
            this.loadStores();
        }
    },
    updateView: function() {
        this.$.fullName.setContent(this.user ? this.user.getFullName() : "");
        // this.$.avatarWindow.applyStyle("background-image", "url(" + this.user.profile.get("avatar") + ")");
        this.$.avatar.setSrc(this.user.profile.get("avatar") || "");
        this.$.heartsCount.setContent(this.user.get("like_count") || 0);
        this.$.chusCount.setContent(this.user.get("chu_count") || 0);
        this.$.followersCount.setContent(this.user.get("follower_count") || 0);
        this.$.followingCount.setContent(this.user.get("following_count") || 0);

        // Hide the follow button if the shown user is identical to the current active user
        var activeUser = chuisy.accounts.getActiveUser();
        this.$.followButton.setShowing(!activeUser || this.user.id != activeUser.id);

        this.$.followButton.setContent(this.user.get("following") ? $L("unfollow") : $L("follow"));
    },
    loadHearts: function() {
        this.$.heartsEmpty.hide();
        this.$.heartsSpinner.show();
        this.user.likedChus.fetch({data: {limit: 3, thumbnails: ["100x100"]}, success: enyo.bind(this, this.refreshHearts)});
    },
    refreshHearts: function() {
        this.$.heartsSpinner.hide();
        this.$.heartsRepeater.setCount(Math.min(this.user.likedChus.length, 3));
        this.$.heartsEmpty.setShowing(!this.user.likedChus.length);
    },
    setupHeart: function(sender, event) {
        var heart = this.user && this.user.likedChus.at(event.index);
        event.item.$.image.applyStyle("background-image", "url(" + heart.get("thumbnails")["100x100"] + ")");
    },
    loadChus: function() {
        this.$.chusEmpty.hide();
        this.$.chusSpinner.show();
        this.user.chus.fetch({data: {limit: 3, thumbnails: ["100x100"]}, success: enyo.bind(this, this.refreshChus)});
    },
    refreshChus: function() {
        this.$.chusSpinner.hide();
        this.$.chusRepeater.setCount(Math.min(this.user.chus.length, 3));
        this.$.chusEmpty.setShowing(!this.user.chus.length);
    },
    setupChu: function(sender, event) {
        var chu = this.user && this.user.chus.at(event.index);
        event.item.$.image.applyStyle("background-image", "url(" + chu.get("thumbnails")["100x100"] + ")");
    },
    loadGoodies: function() {
        this.$.goodiesEmtpy.hide();
        this.$.goodiesSpinner.show();
        this.user.goodies.fetch({data: {limit: 3}, success: enyo.bind(this, this.refreshGoodies)});
    },
    refreshGoodies: function() {
        this.$.goodiesSpinner.hide();
        this.$.goodiesRepeater.setCount(Math.min(this.user.goodies.length, 3));
        this.$.goodiesEmtpy.setShowing(!this.user.goodies.length);
    },
    setupGoody: function(sender, event) {
        var goody = this.user && this.user.goodies.at(event.index);
        event.item.$.image.applyStyle("background-image", "url(" + goody.get("cover_image_thumbnail") + ")");
    },
    loadStores: function() {
        this.$.storesEmpty.hide();
        this.$.storesSpinner.show();
        this.user.followedStores.fetch({data: {limit: 3}, success: enyo.bind(this, this.refreshStores)});
    },
    refreshStores: function() {
        this.$.storesSpinner.hide();
        this.$.storesRepeater.setCount(Math.min(this.user.followedStores.length, 3));
        this.$.storesEmpty.setShowing(!this.user.followedStores.length);
    },
    setupStore: function(sender, event) {
        var store = this.user && this.user.followedStores.at(event.index);
        var rand = Math.ceil(Math.random()*2);
        var coverPlaceholder = "assets/images/store_cover_placeholder_" + rand + ".jpg";
        event.item.$.image.applyStyle("background-image", "url(" + (store.get("cover_image") || coverPlaceholder) + ")");
        event.item.$.storeName.setContent(store.get("name"));
    },
    heartsTapped: function() {
        this.doShowChuList({chus: this.user.likedChus, title: $L("{{ name }}'s Hearts").replace("{{ name }}", this.user.get("first_name"))});
    },
    chusTapped: function() {
        this.doShowChuList({chus: this.user.chus, title: $L("{{ name }}'s Chus").replace("{{ name }}", this.user.get("first_name"))});
    },
    followersTapped: function() {
        this.doShowUserList({users: this.user.followers, title: $L("{{ name }}'s Followers").replace("{{ name }}", this.user.get("first_name"))});
    },
    followingTapped: function() {
        this.doShowUserList({users: this.user.following, title: $L("Followed by {{ name }}").replace("{{ name }}", this.user.get("first_name"))});
    },
    storesTapped: function() {
        this.doShowStoreList({stores: this.user.followedStores, title: $L("Followed by {{ name }}").replace("{{ name }}", this.user.get("first_name"))});
    },
    followButtonTapped: function() {
        if (App.checkConnection()) {
            App.requireSignIn(enyo.bind(this, this.toggleFollow), "follow");
        }
    },
    toggleFollow: function(sender, event) {
        this.user.toggleFollow();
        App.sendCubeEvent("action", {
            type: "follow",
            result: user.get("following") ? "follow" : "unfollow",
            target_user: user,
            context: "profile"
        });
        return true;
    },
    activate: function() {
        this.$.avatar.show();
        this.$.nameFollow.show();
        this.$.scroller.show();
        this.resized();
        this.$.scroller.scrollToTop();
    },
    deactivate: function() {
        this.$.avatar.hide();
        this.$.nameFollow.hide();
        this.$.scroller.hide();
        this.$.avatar.applyStyle("-webkit-transform", "none");
        this.$.nameFollow.applyStyle("-webkit-transform", "none");
    },
    positionParallaxElements: function() {
        this.$.avatar.applyStyle("-webkit-transform", "translate3d(0, " + -this.$.scroller.getScrollTop()/2 + "px, 0)");
        this.$.nameFollow.applyStyle("-webkit-transform", "translate3d(0, " + -this.$.scroller.getScrollTop()/1.5 + "px, 0)");
    },
    components: [
        {kind: "Image", classes: "userview-avatar fadein", name: "avatar"},
        {name: "nameFollow", classes: "userview-name-follow", components: [
            {kind: "Button", name: "followButton", content: "follow", ontap: "followButtonTapped", classes: "userview-follow-button follow-button"},
            {classes: "userview-fullname ellipsis", name: "fullName"}
        ]},
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"}
        ]},
        {kind: "Scroller", fit: true, strategyKind: "TransitionScrollStrategy", preventScrollPropagation: false, onScroll: "positionParallaxElements", components: [
            {classes: "userview-window", components: [
                {style: "position: absolute; bottom: 0; right: 0; width: 100px; height: 50px;", ontap: "followButtonTapped"}
            ]},
            {style: "background-color: #f1f1f1;", components: [
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
                    ]},
                    {kind: "Spinner", classes: "userview-box-spinner", name: "heartsSpinner", showing: false},
                    {name: "heartsEmpty", showing: false, classes: "userview-box-empty", content: $L("Nothing here yet...")}
                ]},
                {classes: "userview-box", ontap: "chusTapped", components: [
                    {classes: "userview-box-label chus"},
                    {kind: "Repeater", style: "display: inline-block;", name: "chusRepeater", onSetupItem: "setupChu", components: [
                        {name: "image", classes: "userview-box-image"}
                    ]},
                    {kind: "Spinner", classes: "userview-box-spinner", name: "chusSpinner", showing: false},
                    {name: "chusEmpty", showing: false, classes: "userview-box-empty", content: $L("Nothing here yet...")}
                ]},
                // {classes: "userview-box followers", components: [
                //     {kind: "Button", classes: "userview-followers-button", allowHtml: true, content: "<strong>21</strong> people follow Martin"},
                //     {kind: "Button", classes: "userview-followers-button", allowHtml: true, content: "Martin follows <strong>5</strong> people"}
                // ]},
                {classes: "userview-box", ontap: "goodiesTapped", components: [
                    {classes: "userview-box-label goodies"},
                    {kind: "Repeater", style: "display: inline-block;", name: "goodiesRepeater", onSetupItem: "setupGoody", components: [
                        {name: "image", classes: "userview-box-image"}
                    ]},
                    {kind: "Spinner", classes: "userview-box-spinner", name: "goodiesSpinner", showing: false},
                    {name: "goodiesEmtpy", showing: false, classes: "userview-box-empty", content: $L("Nothing here yet...")}
                ]},
                {classes: "userview-box", ontap: "storesTapped", components: [
                    {classes: "userview-box-label stores"},
                    {kind: "Repeater", style: "display: inline-block;", name: "storesRepeater", onSetupItem: "setupStore", components: [
                        {name: "image", classes: "userview-box-image", components: [
                            {classes: "userview-store-name ellipsis", name: "storeName"}
                        ]}
                    ]},
                    {kind: "Spinner", classes: "userview-box-spinner", name: "storesSpinner", showing: false},
                    {name: "storesEmpty", showing: false, classes: "userview-box-empty", content: $L("Nothing here yet...")}
                ]},
                {style: "height: 5px;"}
            ]}
        ]}
    ]
});