enyo.kind({
    name: "ProfileView",
    classes: "userview profileview",
    kind: "FittableRows",
    published: {
        user: null
    },
    events: {
        onShowChuList: "",
        onShowUserList: "",
        onShowSettings: "",
        onShowStoreList: ""
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        this.activeUserChanged();
        chuisy.accounts.on("change:active_user", this.activeUserChanged, this);
    },
    activeUserChanged: function() {
        this.setUser(chuisy.accounts.getActiveUser());
    },
    userChanged: function() {
        // Reset avatar to make sure the view doesn't show the avatar of the previous user while the new one is loading
        this.$.avatarWindow.applyStyle("background-image", "url()");
        this.updateView();

        // Bind the user model to this view
        this.stopListening();

        if (this.user) {
            this.$.panels.setIndex(0);
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
        } else {
            this.$.panels.setIndex(1);
        }
    },
    updateView: function() {
        if (this.user) {
            this.$.fullName.setContent(this.user.getFullName());
            this.$.avatarWindow.applyStyle("background-image", "url(" + this.user.profile.get("avatar") + ")");
            this.$.heartsCount.setContent(this.user.get("like_count") || 0);
            this.$.chusCount.setContent(this.user.get("chu_count") || 0);
            this.$.followersCount.setContent(this.user.get("follower_count") || 0);
            this.$.followingCount.setContent(this.user.get("following_count") || 0);
        }
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
    activate: function() {
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
    components: [
        {kind: "Panels", name: "panels", classes: "enyo-fill", draggable: false, animate: false, components: [
            {kind: "Scroller", strategyKind: "TransitionScrollStrategy", components: [
                {classes: "userview-window", name: "avatarWindow", components: [
                    {classes: "userview-fullname", name: "fullName"},
                    {classes: "profileview-settings-button", ontap: "doShowSettings"}
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
                    ]},
                    {kind: "CssSpinner", classes: "userview-box-spinner", name: "heartsSpinner", showing: false},
                    {name: "heartsEmpty", showing: false, classes: "userview-box-empty", content: $L("Nothing here yet...")}
                ]},
                {classes: "userview-box", ontap: "chusTapped", components: [
                    {classes: "userview-box-label chus"},
                    {kind: "Repeater", style: "display: inline-block;", name: "chusRepeater", onSetupItem: "setupChu", components: [
                        {name: "image", classes: "userview-box-image"}
                    ]},
                    {kind: "CssSpinner", classes: "userview-box-spinner", name: "chusSpinner", showing: false},
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
                    {kind: "CssSpinner", classes: "userview-box-spinner", name: "goodiesSpinner", showing: false},
                    {name: "goodiesEmtpy", showing: false, classes: "userview-box-empty", content: $L("Nothing here yet...")}
                ]},
                {classes: "userview-box", ontap: "storesTapped", components: [
                    {classes: "userview-box-label stores"},
                    {kind: "Repeater", style: "display: inline-block;", name: "storesRepeater", onSetupItem: "setupStore", components: [
                        {name: "image", classes: "userview-box-image", components: [
                            {classes: "userview-store-name ellipsis", name: "storeName"}
                        ]}
                    ]},
                    {kind: "CssSpinner", classes: "userview-box-spinner", name: "storesSpinner", showing: false},
                    {name: "storesEmpty", showing: false, classes: "userview-box-empty", content: $L("Nothing here yet...")}
                ]},
                {style: "height: 5px;"}
            ]},
            {components: [
                {classes: "placeholder", name: "placeholder", components: [
                    {classes: "placeholder-image"},
                    {classes: "placeholder-text", content: $L("Here you can see your profile as soon as you log in!")}
                ]},
                {kind: "SignInButton", context: "profile", onSignInSuccess: "signInSuccess", style: "display: block; margin: 0 auto;"},
                {classes: "profileview-terms", allowHtml: true, content: $L("By signing in you accept our<br><a href='http://www.chuisy.com/terms/' target='_blank' class='link'>terms of use</a> and <a href='http://www.chuisy.com/privacy/' target='_blank' class='link'>privacy policy</a>.")}
            ]}
        ]}
    ]
});