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
        this.$.chusMenuButton.setActive(true);
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
    },
    updateView: function() {
        this.$.panels1.setIndex(0);
        this.$.spinner.hide();
        this.$.chusCount.setContent(this.user.get("chu_count"));
        this.$.followersCount.setContent(this.user.get("follower_count"));
        this.$.followingCount.setContent(this.user.get("following_count"));
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
        this.$[which + "Count"].show();
        var count = this.user ? this.user[which].length : 0;
        this.$[which + "Placeholder"].setShowing(!count);
    },
    followButtonTapped: function() {
        if (App.checkConnection()) {
            if (App.isSignedIn()) {
                this.toggleFollow();
            } else {
                enyo.Signals.send("onRequestSignIn", {
                    success: enyo.bind(this, this.toggleFollow)
                });
            }
        }
    },
    toggleFollow: function(sender, event) {
        this.user.toggleFollow();
        return true;
    },
    signIn: function() {
        if (App.checkConnection()) {
            App.loginWithFacebook(enyo.bind(this, function(accessToken) {
                this.$.spinner.show();
                chuisy.signIn(accessToken, enyo.bind(this, function() {
                    this.activate();
                    enyo.Signals.send("onShowGuide", {view: "profile"});
                }), enyo.bind(this, function() {
                    this.$.spinner.hide();
                    navigator.notification.alert($L("Hm, that didn't work. Please try it again later!"), enyo.bind(this, function() {
                    }, $L("Authentication failed"), $L("OK")));
                }));
            }));
        }
    },
    activate: function(obj) {
        if (obj) {
            this.setUser(obj);
        }
        this.$.panels1.setIndexDirect(!obj && !App.isSignedIn() ? 1 : 0);

        if (this.user) {
            this.$.followersSpinner.show();
            this.$.followersCount.hide();
            this.user.followers.fetch();
            this.$.followingSpinner.show();
            this.$.followingCount.hide();
            this.user.following.fetch();
            this.$.chusSpinner.show();
            this.$.chusCount.hide();
            this.user.chus.fetch({data: {limit: this.$.chuList.getChusPerPage()}, success: enyo.bind(this, function() {
                this.$.chusSpinner.hide();
                this.$.chusCount.show();
                this.$.chusPlaceholder.setShowing(!this.user || !this.user.chus.length);
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
                        {kind: "onyx.Button", name: "followButton", content: "follow", ontap: "followButtonTapped", classes: "profileview-follow-button follow-button"}
                    ]}
                ]},
                {kind: "onyx.RadioGroup", onActivate: "menuItemSelected", classes: "profileview-menu", components: [
                    {classes: "profileview-menu-button", value: 0, name: "chusMenuButton", components: [
                        {classes: "profileview-menu-button-caption", content: $L("Chus")},
                        {classes: "profileview-menu-button-count", name: "chusCount"},
                        {classes: "onyx-spinner tiny", name: "chusSpinner", showing: false}
                    ]},
                    {classes: "profileview-menu-button", value: 1, name: "followingMenuButton", components: [
                        {classes: "profileview-menu-button-caption", content: $L("Following")},
                        {classes: "profileview-menu-button-count", name: "followingCount"},
                        {classes: "onyx-spinner tiny", name: "followingSpinner", showing: false}
                    ]},
                    {classes: "profileview-menu-button", value: 2, name: "followersMenuButton", components: [
                        {classes: "profileview-menu-button-caption", content: $L("Followers")},
                        {classes: "profileview-menu-button-count", name: "followersCount"},
                        {classes: "onyx-spinner tiny", name: "followersSpinner", showing: false}
                    ]}
                ]},
                {kind: "Panels", name: "panels", arrangerKind: "CarouselArranger", fit: true, draggable: false, components: [
                    {classes: "enyo-fill", components: [
                        {name: "chusPlaceholder", classes: "profileview-list-placeholder chus"},
                        {kind: "ChuList", classes: "enyo-fill", onShowChu: "showChu", onRefresh: "chuListRefresh"}
                    ]},
                    {classes: "enyo-fill", components: [
                        {name: "followingPlaceholder", classes: "profileview-list-placeholder following"},
                        {kind: "UserList", name: "followingList", classes: "enyo-fill", rowsPerPage: 20}
                    ]},
                    {classes: "enyo-fill", components: [
                        {name: "followersPlaceholder", classes: "profileview-list-placeholder followers"},
                        {kind: "UserList", name: "followersList", classes: "enyo-fill", rowsPerPage: 20}
                    ]}
                ]}
            ]},
            {components: [
                {classes: "placeholder", name: "placeholder", components: [
                    {classes: "placeholder-image"},
                    {classes: "placeholder-text", content: $L("This is where your profile would be if you were signed in!")}
                ]},
                {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
                    {classes: "facebook-button-icon"},
                    {content: $L("Sign In With Facebook")}
                ]},
                {kind: "onyx.Spinner", classes: "profileview-login-spinner", showing: false}
            ]}
        ]}
    ]
});