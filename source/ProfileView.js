enyo.kind({
    name: "ProfileView",
    // kind: "FittableRows",
    classes: "profileview",
    published: {
        user: null
    },
    events: {
        onShowChu: "",
        onShowUser: "",
        onShowSettings: ""
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    userChanged: function() {
        this.$.likedChusMenuButton.setActive(true);
        this.$.panels.setIndex(0);

        this.$.info.applyStyle("background-image", "url()");

        this.stopListening();

        this.updateView();
        this.listenTo(this.user, "change", this.updateView);

        this.$.followersList.setUsers(this.user.followers);
        this.$.followingList.setUsers(this.user.following);

        this.synced("following");
        this.listenTo(this.user.followers, "sync", _.bind(this.synced, this, "followers"));
        this.synced("followers");
        this.listenTo(this.user.following, "sync", _.bind(this.synced, this, "following"));

        this.$.chuList.setChus(this.user.chus);
        this.$.likedChuList.setChus(this.user.likedChus);
    },
    updateView: function() {
        this.$.panels1.setIndex(0);
        this.$.chusCount.setContent(this.user.get("chu_count"));
        this.$.followersCount.setContent(this.user.get("follower_count"));
        this.$.followingCount.setContent(this.user.get("following_count"));
        this.$.likedChusCount.setContent(this.user.get("like_count"));
        var avatar = this.user.get("localAvatar") || this.user.profile.get("avatar");
        this.$.info.applyStyle("background-image", "url(" + avatar + ")");
        this.$.fullName.setContent(this.user.get("first_name") ? (this.user.get("first_name") + " " + this.user.get("last_name")) : "");

        this.$.followButton.setContent(this.user.get("following") ? "unfollow" : "follow");
        var activeUser = chuisy.accounts.getActiveUser();
        this.addRemoveClass("owned", activeUser && this.user.id == activeUser.id);
    },
    menuItemSelected: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.panels.setIndex(event.originator.value);
            // var listMap = {
            //     0: this.$.chuList,
            //     1: this.$.followingList,
            //     2: this.$.followersList
            // };
            // var list = listMap[event.originator.value];
            // this.checkCollapsed(list);
        }
    },
    showChu: function(sender, event) {
        if (App.checkConnection()) {
            this.doShowChu(event);
        }
        return true;
    },
    synced: function(which) {
        this.$[which + "Spinner"].hide();
        var coll = this.user && this.user[which];
        var count = coll && (coll.meta && coll.meta.total_count || coll.length) || 0;
        // this.$[which + "Count"].setContent(count);
        this.$[which + "Placeholder"].setShowing(!count);
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
    signInSuccess: function() {
        this.activate();
    },
    activate: function(obj) {
        if (obj) {
            this.setUser(obj);
        }
        this.$.panels1.setIndexDirect(!obj && !App.isSignedIn() ? 1 : 0);

        if (this.user) {
            this.$.followersSpinner.setShowing(!this.user.followers.length);
            this.user.followers.fetch();
            this.$.followingSpinner.setShowing(!this.user.following.length);
            this.user.following.fetch();
            this.$.chusSpinner.setShowing(!this.user.chus.length);
            this.$.likedChusSpinner.setShowing(!this.user.likedChus.length);
            this.user.chus.fetch({data: {limit: this.$.chuList.getChusPerPage(), thumbnails: ["100x100"]}, success: enyo.bind(this, function() {
                this.$.chusSpinner.hide();
                this.$.chusPlaceholder.setShowing(!this.user || !this.user.chus.length);
            })});
            this.user.likedChus.fetch({data: {limit: this.$.likedChuList.getChusPerPage(), thumbnails: ["100x100"]}, success: enyo.bind(this, function() {
                this.$.likedChusSpinner.hide();
                this.$.likedChusPlaceholder.setShowing(!this.user || !this.user.likedChus.length);
                this.$.likedChusCount.setContent(this.user.likedChus.meta.total_count);
            })});
        }
    },
    deactivate: function() {},
    checkCollapsed: function(list) {
        var scrollTop = list.getScrollTop();
        var collapsed = collapsed ? (scrolltop > 100) : list.getScrollTop() > 500;
        if (this.collapsed != collapsed) {
            this.$.window.addRemoveClass("collapsed", collapsed);
            setTimeout(enyo.bind(this, function() {
                this.$.fittableRows.reflow();
            }), 150);
            this.collapsed = collapsed;
        }
        return true;
    },
    components: [
        {kind: "Panels", name: "panels1", classes: "enyo-fill", draggable: false, components: [
            {kind: "FittableRows", components: [
                {classes: "profileview-window", name: "window", components: [
                    {classes: "profileview-info profileview-avatar-placeholder"},
                    {classes: "profileview-info", name: "info", components: [
                        {classes: "profileview-fullname", name: "fullName"},
                        {classes: "profileview-settings-button", ontap: "doShowSettings"},
                        {kind: "Button", name: "followButton", content: "follow", ontap: "followButtonTapped", classes: "profileview-follow-button follow-button"}
                    ]}
                ]},
                {kind: "onyx.RadioGroup", onActivate: "menuItemSelected", classes: "profileview-menu", components: [
                    {classes: "profileview-menu-button", value: 0, name: "likedChusMenuButton", components: [
                        {classes: "profileview-menu-button-caption", content: $L("Hearts")},
                        {classes: "profileview-menu-button-count", name: "likedChusCount"}
                    ]},
                    {classes: "profileview-menu-button", value: 1, name: "chusMenuButton", components: [
                        {classes: "profileview-menu-button-caption", content: $L("Chus")},
                        {classes: "profileview-menu-button-count", name: "chusCount"}
                    ]},
                    {classes: "profileview-menu-button", value: 2, name: "followingMenuButton", components: [
                        {classes: "profileview-menu-button-caption", content: $L("Following")},
                        {classes: "profileview-menu-button-count", name: "followingCount"}
                    ]},
                    {classes: "profileview-menu-button", value: 3, name: "followersMenuButton", components: [
                        {classes: "profileview-menu-button-caption", content: $L("Followers")},
                        {classes: "profileview-menu-button-count", name: "followersCount"}
                    ]}
                ]},
                {kind: "Panels", name: "panels", fit: true, draggable: false, components: [
                    {classes: "enyo-fill", components: [
                        {kind: "CssSpinner", classes: "profileview-tab-spinner", name: "likedChusSpinner", showing: false},
                        {name: "likedChusPlaceholder", classes: "profileview-list-placeholder likes"},
                        {kind: "ChuList", name: "likedChuList", classes: "enyo-fill", onShowChu: "showChu", onRefresh: "chuListRefresh"}
                    ]},
                    {classes: "enyo-fill", components: [
                        {kind: "CssSpinner", classes: "profileview-tab-spinner", name: "chusSpinner", showing: false},
                        {name: "chusPlaceholder", classes: "profileview-list-placeholder chus"},
                        {kind: "ChuList", classes: "enyo-fill", onShowChu: "showChu", onRefresh: "chuListRefresh"}
                    ]},
                    {classes: "enyo-fill", components: [
                        {kind: "CssSpinner", classes: "profileview-tab-spinner", name: "followingSpinner", showing: false},
                        {name: "followingPlaceholder", classes: "profileview-list-placeholder following"},
                        {kind: "UserList", name: "followingList", classes: "enyo-fill", rowsPerPage: 20}
                    ]},
                    {classes: "enyo-fill", components: [
                        {kind: "CssSpinner", classes: "profileview-tab-spinner", name: "followersSpinner", showing: false},
                        {name: "followersPlaceholder", classes: "profileview-list-placeholder followers"},
                        {kind: "UserList", name: "followersList", classes: "enyo-fill", rowsPerPage: 20}
                    ]}
                ]}
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