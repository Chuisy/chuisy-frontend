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

        this.refresh("following");
        this.listenTo(this.user.followers, "reset add", _.bind(this.refresh, this, "followers"));
        this.refresh("followers");
        this.listenTo(this.user.following, "reset add", _.bind(this.refresh, this, "following"));

        this.$.chuList.setChus(this.user.chus);

        this.user.followers.fetch();
        this.user.following.fetch();
        this.user.chus.fetch({data: {limit: this.$.chuList.getChusPerPage()}});
    },
    updateView: function() {
        this.$.panels1.setIndex(0);
        this.$.spinner.hide();
        this.$.chuCount.setContent(this.user.get("chu_count"));
        this.$.followersCount.setContent(this.user.get("follower_count"));
        this.$.followingCount.setContent(this.user.get("following_count"));
        var avatar = this.user.get("localAvatar") || this.user.profile.get("avatar");
        this.$.info.applyStyle("background-image", "url(" + avatar + ")");
        this.$.fullName.setContent(this.user.get("first_name") ? (this.user.get("first_name") + " " + this.user.get("last_name")) : "");

        this.$.followButton.setContent(this.user.get("following") ? "unfollow" : "follow");
        this.addRemoveClass("owned", this.user.id == chuisy.accounts.getActiveUser().id);
    },
    menuItemSelected: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.panels.setIndex(event.originator.value);
        }
    },
    showChu: function(sender, event) {
        if (App.checkConnection()) {
            this.doShowChu(event);
        }
        return true;
    },
    refresh: function(which) {
        this.$[which + "List"].setCount(this.user ? this.user[which].length : 0);
        this.$[which + "List"].refresh();
    },
    setupItem: function(sender, event) {
        var which = sender.which;
        var coll = this.user[which];
        var user = coll.at(event.index);
        this.$[which + "Item"].setUser(user);

        var isLastItem = event.index == coll.length-1;
        if (isLastItem && coll.hasNextPage()) {
            this.$[which + "NextPage"].show();
            coll.fetchNext();
        } else {
            this.$[which + "NextPage"].hide();
        }
    },
    userTapped: function(sender, event) {
        var which = sender.which;
        if (App.checkConnection()) {
            var user = this.user[which].at(event.index);
            this.doShowUser({user: user});
        }
        event.preventDefault();
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
    listToggleFollow: function(sender, event) {
        var which = sender.which;
        var user = this.user[which].at(event.index);
        user.toggleFollow();
        this.$[which + "List"].refresh();
        return true;
    },
    chusFinishedLoading: function(sender, event) {
    },
    signIn: function() {
        if (App.checkConnection()) {
            App.loginWithFacebook(enyo.bind(this, function(accessToken) {
                this.$.spinner.show();
                chuisy.signIn(accessToken, enyo.bind(this, function() {
                    // this.$.spinner.hide();
                    // this.$.panels1.setIndex(0);
                }), enyo.bind(this, function() {
                    this.$.spinner.hide();
                    navigator.notification.alert($L("Hm, that didn't work. Please try it again later!"), enyo.bind(this, function() {
                        this.doDone();
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
    },
    deactivate: function() {},
    checkCollapsed: function(list) {
        var collapsed = list.getScrollTop() > 100;
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
                        {classes: "profileview-menu-button-count", name: "chuCount"}
                    ]},
                    {classes: "profileview-menu-button", value: 1, name: "followingMenuButton", components: [
                        {classes: "profileview-menu-button-caption", content: $L("Following")},
                        {classes: "profileview-menu-button-count", name: "followingCount"}
                    ]},
                    {classes: "profileview-menu-button", value: 2, name: "followersMenuButton", components: [
                        {classes: "profileview-menu-button-caption", content: $L("Followers")},
                        {classes: "profileview-menu-button-count", name: "followersCount"}
                    ]}
                ]},
                {kind: "Panels", name: "panels", arrangerKind: "CarouselArranger", fit: true, draggable: false, components: [
                    {kind: "ChuList", classes: "enyo-fill", onShowChu: "showChu", onScroll: "checkCollapsed"},
                    {kind: "List", name: "followingList", onSetupItem: "setupItem", classes: "enyo-fill", which: "following", rowsPerPage: 20, onScroll: "checkCollapsed", components: [
                        {kind: "UserListItem", which: "following", name: "followingItem", ontap: "userTapped", onToggleFollow: "listToggleFollow"},
                        {name: "followingNextPage", classes: "loading-next-page", content: $L("Loading...")}
                    ]},
                    {kind: "List", name: "followersList", onSetupItem: "setupItem", classes: "enyo-fill", which: "followers", rowsPerPage: 20, onScroll: "checkCollapsed", components: [
                        {kind: "UserListItem", which: "followers", name: "followersItem", ontap: "userTapped", onToggleFollow: "listToggleFollow"},
                        {name: "followersNextPage", classes: "loading-next-page", content: $L("Loading...")}
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
                ]}
            ]}
        ]},
        {kind: "onyx.Spinner", classes: "absolute-center", showing: false}
    ]
});