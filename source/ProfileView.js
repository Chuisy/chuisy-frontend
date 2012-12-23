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
        onOpenSettings: ""
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
        if (!this.authUser || this.authUser.id != event.user.id) {
            this.authUser = event.user;
            this.userChanged();
        }
    },
    getShowedUser: function() {
        return this.user == "me" ? this.authUser : this.user;
    },
    userChanged: function() {
        var user = this.getShowedUser();
        if (user) {
            this.$.info.applyStyle("background-image", "url(" + user.profile.avatar + ")");
            this.$.fullName.setContent(user.first_name + " " + user.last_name);
            this.$.chuboxCount.setContent(user.chu_count);
            this.$.followerCount.setContent(user.follower_count);
            this.$.friendCount.setContent(user.following_count);
            this.$.chuList.setFilters([["user", user.id]]);
            this.$.chuList.load();
            this.load("friends");
            this.load("followers");
            this.$.followButton.setContent(this.user.following ? "unfollow" : "follow");
            this.$.chuboxMenuButton.setActive(true);
            this.$.panels.setIndex(0);
            this.addRemoveClass("owned", this.authUser && this.authUser.id == user.id);
        }
    },
    menuItemSelected: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.panels.setIndex(event.originator.value);
        }
    },
    showChu: function(sender, event) {
        this.doShowChu(event);
        return true;
    },
    load: function(which) {
        var user = this.getShowedUser();
        var filterProp = which == "followers" ? "followee" : "user";
        chuisy.followingrelation.list([[filterProp, user.id]], enyo.bind(this, function(sender, response) {
            this[which + "Meta"] = response.meta;
            this[which] = response.objects;
            this.refresh(which);
        }), {limit: this[which + "Meta"].limit});
    },
    nextPage: function(which) {
        user = this.getShowedUser();
        var filterProp = which == "followers" ? "followee" : "user";
        chuisy.followingrelation.list([[filterProp, user.id]], enyo.bind(this, function(sender, response) {
            this[which + "Meta"] = response.meta;
            this[which] = this[which].concat(response.objects);
            this.refresh(which);
        }), {limit: this[which + "Meta"].limit, offset: this[which + "Meta"].offset + this[which + "Meta"].limit});
    },
    refresh: function(which) {
        this.$[which + "List"].setCount(this[which].length);
        this.$[which + "List"].render();
    },
    setupItem: function(sender, event) {
        var which = sender.which;
        var relation = this[which][event.index];
        var prop = which == "followers" ? "user" : "followee";
        event.item.$[which + "Item"].setUser(relation[prop]);

        var isLastItem = event.index == this[which].length-1;
        if (isLastItem && !this.allPagesLoaded(which)) {
            event.item.$[which + "NextPage"].show();
            this.nextPage(which);
        } else {
            event.item.$[which + "NextPage"].hide();
        }
    },
    friendTapped: function(sender, event) {
        var user = this.friends[event.index].followee;
        this.doShowUser({user: user});
        event.preventDefault();
    },
    followerTapped: function(sender, event) {
        var user = this.followers[event.index].user;
        this.doShowUser({user: user});
        event.preventDefault();
    },
    followButtonTapped: function() {
        if (chuisy.getSignInStatus().signedIn) {
            this.toggleFollow();
        } else {
            enyo.Signals.send("onRequestSignIn", {
                success: enyo.bind(this, this.toggleFollow)
            });
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
    allPagesLoaded: function(which) {
        var meta = this[which + "Meta"];
        return meta.offset + meta.limit >= meta.total_count;
    },
    activate: function(obj) {
        this.setUser(obj);
    },
    deactivate: function() {},
    components: [
        {classes: "profileview-info", name: "info", components: [
            {classes: "profileview-fullname", name: "fullName"},
            {classes: "profileview-settings-button", ontap: "doOpenSettings"},
            {kind: "onyx.Button", name: "followButton", content: "follow", ontap: "followButtonTapped", classes: "profileview-follow-button follow-button"}
        ]},
        {kind: "onyx.RadioGroup", onActivate: "menuItemSelected", classes: "profileview-menu", components: [
            {classes: "profileview-menu-button", value: 0, name: "chuboxMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: "Chus"},
                {classes: "profileview-menu-button-count", name: "chuboxCount"}
            ]},
            {classes: "profileview-menu-button", value: 1, name: "friendsMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: "Following"},
                {classes: "profileview-menu-button-count", name: "friendCount"}
            ]},
            {classes: "profileview-menu-button", value: 2, name: "followersMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: "Followers"},
                {classes: "profileview-menu-button-count", name: "followerCount"}
            ]}
        ]},
        {kind: "Panels", name: "panels", arrangerKind: "CarouselArranger", fit: true, draggable: false, components: [
            {kind: "ChuList", classes: "enyo-fill", onShowChu: "showChu"},
            {kind: "Scroller", classes: "enyo-fill", components: [
                {kind: "Repeater", name: "friendsList", onSetupItem: "setupItem", classes: "enyo-fill", which: "friends", components: [
                    {kind: "UserListItem", name: "friendsItem", ontap: "friendTapped", onFollowingChanged: "followingChanged"},
                    {name: "friendsNextPage", classes: "loading-next-page"}
                ]}
            ]},
            {kind: "Scroller", classes: "enyo-fill", components: [
                {kind: "Repeater", name: "followersList", onSetupItem: "setupItem", classes: "enyo-fill", which: "followers", components: [
                    {kind: "UserListItem", name: "followersItem", ontap: "followerTapped", onFollowingChanged: "followingChanged"},
                    {name: "followersNextPage", classes: "loading-next-page"}
                ]}
            ]}
        ]},
        {kind: "enyo.Signals", onUserChanged: "authUserChanged"}
    ]
});