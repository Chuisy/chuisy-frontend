enyo.kind({
    name: "ProfileView",
    kind: "FittableRows",
    classes: "profileview",
    published: {
        user: null
    },
    events: {
        onChuSelected: "",
        onShowProfile: "",
        onToggleMenu: "",
        onBack: ""
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
            this.$.avatar.setSrc(user.profile.avatar);
            this.$.fullName.setContent(user.first_name + " " + user.last_name);
            this.$.userName.setContent(user.username);
            this.$.bio.setContent(user.profile.bio);
            this.$.chuGrid.setFilters([["user", user.id]]);
            this.$.chuGrid.setCount(user.chu_count);
            this.loadFriends(user);
            this.loadFollowers(user);
            this.$.followButton.addRemoveClass("active", user.following);
            this.$.chuboxMenuButton.setActive(true);
            this.$.panels.setIndex(0);
            this.addRemoveClass("owned", this.authUser && this.authUser.id == user.id);
        }
        this.$.menuButton.setShowing(this.user == "me");
        this.$.backButton.setShowing(this.user != "me");
    },
    menuItemSelected: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.panels.setIndex(event.originator.value);
        }
    },
    chuSelected: function(sender, event) {
        this.doChuSelected(event);
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
        var user = this.showedUser;
        var button = this.$.followButton;

        button.setDisabled(true);
        if (user.following) {
            chuisy.followingrelation.remove(user.following, enyo.bind(this, function(sender, response) {
                user.following = false;
                button.setDisabled(false);
                button.removeClass("active");
            }));
        } else {
            var params = {
                followee: user.resource_uri
            };
            chuisy.followingrelation.create(params, enyo.bind(this, function(sender, response) {
                user.following = response.id;
                button.setDisabled(false);
                button.addClass("active");
            }));
        }
        return true;
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", name: "menuButton", components: [
                {classes: "menu-button-icon"}
            ]},
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back", name: "backButton"},
            {classes: "mainheader-text", content: "Profile"}
        ]},
        {classes: "provileview-info", components: [
            {kind: "Image", classes: "profileview-avatar", name: "avatar"},
            {classes: "profileview-profileinfo", components: [
                {classes: "profileview-fullname", name: "fullName"},
                {classes: "profileview-username ellipsis", name: "userName"},
                {classes: "profileview-bio", name: "bio"}
            ]},
            {kind: "onyx.Button", name: "followButton", content: "follow", ontap: "followButtonTapped", classes: "follow-button"}
        ]},
        {kind: "onyx.RadioGroup", onActivate: "menuItemSelected", classes: "profileview-menu", components: [
            {classes: "profileview-menu-button", value: 0, name: "chuboxMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: "Chu Box"},
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
            {kind: "ChuGrid", classes: "enyo-fill", onItemSelected: "chuboxItemSelected"},
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
        {kind: "enyo.Signals", onUserChanged: "authUserChanged"}
    ]
});