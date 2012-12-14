enyo.kind({
    name: "ProfileView",
    kind: "FittableRows",
    classes: "profileview",
    published: {
        user: null
    },
    events: {
        onShowChu: "",
        onShowProfile: "",
        onOpenSettings: ""
    },
    authUserChanged: function(sender, event) {
        if (!this.authUser || this.authUser.id != event.user.id) {
            this.authUser = event.user;
            this.userChanged();
        }
    },
    userChanged: function() {
        var user = this.user == "me" ? this.authUser : this.user;
        if (user) {
            this.$.info.applyStyle("background-image", "url(" + user.profile.avatar + ")");
            this.$.fullName.setContent(user.first_name + " " + user.last_name);
            this.$.chuboxCount.setContent(user.chu_count);
            this.$.followerCount.setContent(user.follower_count);
            this.$.friendCount.setContent(user.following_count);
            this.$.chuList.setFilters([["user", user.id]]);
            this.$.chuList.load();
            this.loadFriends(user);
            this.loadFollowers(user);
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
    loadFriends: function(user) {
        chuisy.followingrelation.list([["user", user.id]], enyo.bind(this, function(sender, response) {
            this.friends = response.objects;
            this.refreshFriends();
        }));
    },
    refreshFriends: function() {
        this.$.friendList.setCount(this.friends.length);
        this.$.friendList.build();
    },
    setupFriend: function(sender, event) {
        var relation = this.friends[event.index];
        event.item.$.friendItem.setUser(relation.followee);
    },
    friendTapped: function(sender, event) {
        var user = this.friends[event.index].followee;
        this.doShowProfile({user: user});
        event.preventDefault();
    },
    loadFollowers: function(user) {
        chuisy.followingrelation.list([["followee", user.id]], enyo.bind(this, function(sender, response) {
            this.followers = response.objects;
            this.refreshFollowers();
        }));
    },
    refreshFollowers: function() {
        this.$.followerList.setCount(this.followers.length);
        this.$.followerList.build();
    },
    setupFollower: function(sender, event) {
        var relation = this.followers[event.index];
        event.item.$.followerItem.setUser(relation.user);
    },
    followerTapped: function(sender, event) {
        var user = this.followers[event.index].user;
        this.doShowProfile({user: user});
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
    notificationsUpdated: function(sender, event) {
        this.$.notificationBadge.setContent(event.unseen_count);
        this.$.notificationBadge.setShowing(event.unseen_count);
        return true;
    },
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
                {kind: "Repeater", name: "friendList", onSetupItem: "setupFriend", classes: "enyo-fill", components: [
                    {kind: "UserListItem", name: "friendItem", ontap: "friendTapped", onFollowingChanged: "followingChanged"}
                ]}
            ]},
            {kind: "Scroller", classes: "enyo-fill", components: [
                {kind: "Repeater", name: "followerList", onSetupItem: "setupFollower", classes: "enyo-fill", components: [
                    {kind: "UserListItem", name: "followerItem", ontap: "followerTapped", onFollowingChanged: "followingChanged"}
                ]}
            ]}
        ]},
        {kind: "enyo.Signals", onUserChanged: "authUserChanged", onNotificationsUpdated: "notificationsUpdated"}
    ]
});