enyo.kind({
    name: "ProfileView",
    kind: "FittableRows",
    classes: "profileview",
    published: {
        user: null
    },
    events: {
        onShowChu: "",
        onShowUser: "",
        onShowSettings: ""
    },
    friendsMeta: {
        limit: 20,
        offset: 0,
        total_count: 0
    },
    followersMeta: {
        limit: 20,
        offset: 0,
        total_count: 0
    },
    authUserChanged: function(sender, event) {
        if (!this.authUser || this.authUser != event.user) {
            this.authUser = event.user;
            this.userChanged();
        }
    },
    getShowedUser: function() {
        return this.user || this.authUser;
    },
    userChanged: function() {
        var user = this.getShowedUser();
        if (user) {
            this.$.info.applyStyle("background-image", "url(" + user.profile.avatar + ")");
            this.$.fullName.setContent(user.first_name + " " + user.last_name);
            // this.$.chuboxCount.setContent(user.chu_count);
            // this.$.followersCount.setContent(user.follower_count);
            // this.$.friendsCount.setContent(user.following_count);
            this.$.chuList.clear();
            this.$.chuboxCount.setContent($L("Loading..."));
            this.$.chuList.setFilters([["user", user.id]]);
            this.$.chuList.load();
            this.load("friends");
            this.load("followers");
            this.$.followButton.setContent(user.following ? "unfollow" : "follow");
            this.$.chuboxMenuButton.setActive(true);
            this.$.panels.setIndex(0);
            this.addRemoveClass("owned", user == this.authUser);
        }
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
    load: function(which) {
        this.$[which + "Count"].setContent($L("Loading..."));
        this[which] = [];
        this.refresh(which);
        var user = this.getShowedUser();
        if (user) {
            var filterProp = which == "followers" ? "followee" : "user";
            chuisy.followingrelation.list([[filterProp, user.id]], enyo.bind(this, function(sender, response) {
                this[which + "Meta"] = response.meta;
                this[which] = response.objects;
                this.refresh(which);
                this.$[which + "Count"].setContent(response.meta.total_count);
            }), {limit: this[which + "Meta"].limit});
        }
    },
    nextPage: function(which) {
        user = this.getShowedUser();
        if (user) {
            var filterProp = which == "followers" ? "followee" : "user";
            chuisy.followingrelation.list([[filterProp, user.id]], enyo.bind(this, function(sender, response) {
                this[which + "Meta"] = response.meta;
                this[which] = this[which].concat(response.objects);
                this.refresh(which);
            }), {limit: this[which + "Meta"].limit, offset: this[which + "Meta"].offset + this[which + "Meta"].limit});
        }
    },
    refresh: function(which) {
        this.$[which + "List"].setCount(this[which].length);
        this.$[which + "List"].refresh();
    },
    setupItem: function(sender, event) {
        var which = sender.which;
        var relation = this[which][event.index];
        var prop = which == "followers" ? "user" : "followee";
        this.$[which + "Item"].setUser(relation[prop]);

        var isLastItem = event.index == this[which].length-1;
        if (isLastItem && !this.allPagesLoaded(which)) {
            this.$[which + "NextPage"].show();
            this.nextPage(which);
        } else {
            this.$[which + "NextPage"].hide();
        }
    },
    friendTapped: function(sender, event) {
        if (App.checkConnection()) {
            var user = this.friends[event.index].followee;
            this.doShowUser({user: user});
        }
        event.preventDefault();
    },
    followerTapped: function(sender, event) {
        if (App.checkConnection()) {
            var user = this.followers[event.index].user;
            this.doShowUser({user: user});
        }
        event.preventDefault();
    },
    followButtonTapped: function() {
        if (App.checkConnection()) {
            if (chuisy.getSignInStatus().signedIn) {
                this.toggleFollow();
            } else {
                enyo.Signals.send("onRequestSignIn", {
                    success: enyo.bind(this, this.toggleFollow)
                });
            }
        }
    },
    toggleFollow: function(sender, event) {
        var user = this.user;
        var button = this.$.followButton;

        button.setDisabled(true);
        button.setContent(user.following ? "follow" : "unfollow");
        if (user.following) {
            chuisy.followingrelation.remove(user.following, enyo.bind(this, function(sender, response) {
                user.following = false;
                button.setDisabled(false);
            }));
        } else {
            var params = {
                followee: user.resource_uri
            };
            chuisy.followingrelation.create(params, enyo.bind(this, function(sender, response) {
                user.following = response.id;
                button.setDisabled(false);
            }));
        }
        return true;
    },
    listToggleFollow: function(sender, event) {
        var which = sender.which;
        var user = this[which][event.index][which == "followers" ? "user" : "followee"];

        // button.setDisabled(true);
        // button.setContent(user.following ? "follow" : "unfollow");
        if (user.following) {
            // There is a following relation with id _user.following_. Delete it
            chuisy.followingrelation.remove(user.following, enyo.bind(this, function(sender, response) {
                // button.setDisabled(false);
            }));
            user.following = false;
        } else {
            // Not following this user yet. Create a following relation
            var params = {
                followee: user.resource_uri
            };
            chuisy.followingrelation.create(params, enyo.bind(this, function(sender, response) {
                user.following = response.id;
                // button.setDisabled(false);
            }));
            user.following = true;
        }
        this.$[which + "List"].refresh();
        return true;
    },
    allPagesLoaded: function(which) {
        var meta = this[which + "Meta"];
        return meta.offset + meta.limit >= meta.total_count;
    },
    chusFinishedLoading: function(sender, event) {
        this.$.chuboxCount.setContent(event.total_count);
    },
    activate: function(obj) {
        this.setUser(obj);
        if (this.getShowedUser().id == this.authUser.id) {
            enyo.Signals.send("onShowGuide", {view: "profile"});
        }
    },
    deactivate: function() {},
    components: [
        {classes: "profileview-info", name: "info", components: [
            {classes: "profileview-fullname", name: "fullName"},
            {classes: "profileview-settings-button", ontap: "doShowSettings"},
            {kind: "onyx.Button", name: "followButton", content: "follow", ontap: "followButtonTapped", classes: "profileview-follow-button follow-button"}
        ]},
        {kind: "onyx.RadioGroup", onActivate: "menuItemSelected", classes: "profileview-menu", components: [
            {classes: "profileview-menu-button", value: 0, name: "chuboxMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: $L("Chus")},
                {classes: "profileview-menu-button-count", name: "chuboxCount"}
            ]},
            {classes: "profileview-menu-button", value: 1, name: "friendsMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: $L("Following")},
                {classes: "profileview-menu-button-count", name: "friendsCount"}
            ]},
            {classes: "profileview-menu-button", value: 2, name: "followersMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: $L("Followers")},
                {classes: "profileview-menu-button-count", name: "followersCount"}
            ]}
        ]},
        {kind: "Panels", name: "panels", arrangerKind: "CarouselArranger", fit: true, draggable: false, components: [
            {kind: "ChuList", classes: "enyo-fill", onShowChu: "showChu", onFinishedLoading: "chusFinishedLoading"},
            {kind: "List", name: "friendsList", onSetupItem: "setupItem", classes: "enyo-fill", which: "friends", rowsPerPage: 20, components: [
                {kind: "UserListItem", which: "friends", name: "friendsItem", ontap: "friendTapped", onToggleFollow: "listToggleFollow"},
                {name: "friendsNextPage", classes: "loading-next-page", content: $L("Loading...")}
            ]},
            {kind: "List", name: "followersList", onSetupItem: "setupItem", classes: "enyo-fill", which: "followers", rowsPerPage: 20, components: [
                {kind: "UserListItem", which: "followers", name: "followersItem", ontap: "followerTapped", onToggleFollow: "listToggleFollow"},
                {name: "followersNextPage", classes: "loading-next-page", content: $L("Loading...")}
            ]}
        ]},
        {kind: "enyo.Signals", onUserChanged: "authUserChanged"}
    ]
});