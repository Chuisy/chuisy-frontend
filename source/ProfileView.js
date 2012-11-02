enyo.kind({
    name: "ProfileView",
    kind: "FittableRows",
    classes: "profileview",
    published: {
        user: null, // Currently signed in user
        showedUser: null // User who's profile to show
    },
    events: {
        onChuSelected: "",
        onChuboxItemSelected: "",
        onShowProfile: "",
        onToggleMenu: "",
        onBack: ""
    },
    userChanged: function() {
        this.$.chubox.setUser(this.user);
        this.showedUserChanged();
    },
    showedUserChanged: function() {
        var user = this.showedUser == "me" ? this.user : this.showedUser;
        if (user) {
            this.$.avatar.setSrc(user.profile.avatar);
            this.$.fullName.setContent(user.first_name + " " + user.last_name);
            this.$.userName.setContent(user.username);
            this.$.bio.setContent(user.profile.bio);
            this.loadChus(user);
            this.$.chubox.setBoxOwner(user);
            this.loadFriends(user);
            this.loadFollowers(user);
            this.$.followButton.addRemoveClass("active", user.following);
            this.$.chusMenuButton.setActive(true);
            this.$.panels.setIndex(0);
            this.addRemoveClass("owned", this.user.id == user.id);
        }
        this.$.menuButton.setShowing(this.showedUser == "me");
        this.$.backButton.setShowing(this.showedUser != "me");
    },
    loadChus: function(user) {
        chuisy.chu.list([["user", user.id]], enyo.bind(this, function(sender, response) {
            this.chus = response.objects;
            this.refreshChus();
        }));
    },
    refreshChus: function() {
        this.$.chuList.setCount(this.chus.length);
        this.$.chuList.refresh();
    },
    setupChu: function(sender, event) {
        var chu = this.chus[event.index];
        this.$.listChu.setChu(chu);
    },
    chuTapped: function(sender, event) {
        var chu = this.chus[event.index];
        this.doChuSelected({chu: chu});
    },
    menuItemSelected: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.panels.setIndex(event.originator.value);
        }
    },
    chuboxItemSelected: function(sender, event) {
        this.doChuboxItemSelected(event);
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
        this.$.friendList.refresh();
    },
    setupFriend: function(sender, event) {
        var relation = this.friends[event.index];
        this.$.friendAvatar.setSrc(relation.followee.profile.avatar_thumbnail);
        this.$.friendUsername.setContent(relation.followee.username);
        this.$.friendFollowButton.addRemoveClass("active", relation.followee.following);
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
        this.$.followerList.refresh();
    },
    setupFollower: function(sender, event) {
        var relation = this.followers[event.index];
        this.$.followerAvatar.setSrc(relation.user.profile.avatar_thumbnail);
        this.$.followerUsername.setContent(relation.user.username);
        this.$.followerFollowButton.addRemoveClass("active", relation.user.following);
    },
    followerTapped: function(sender, event) {
        var user = this.followers[event.index].user;
        this.doShowProfile({user: user});
    },
    toggleFollow: function(sender, event) {
        var user, list;
        var button = sender;
        if (typeof(event.index) != "undefined") {
            if (button.list == "friends") {
                user = this.friends[event.index].followee;
                list = this.$.friendList;
            } else {
                user = this.followers[event.index].user;
                list = this.$.followerList;
            }
        } else {
            user = this.showedUser;
        }

        if (list) {
            list.prepareRow(event.index);
        }

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
                {kind: "Image", src: "assets/images/menu-icon.png"}
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
            {kind: "onyx.Button", name: "followButton", content: "follow", ontap: "toggleFollow", classes: "follow-button"}
        ]},
        {kind: "onyx.RadioGroup", onActivate: "menuItemSelected", classes: "profileview-menu", components: [
            {classes: "profileview-menu-button", value: 0, name: "chusMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: "Chus"},
                {classes: "profileview-menu-button-count", name: "chuCount"}
            ]},
            {classes: "profileview-menu-button", value: 1, name: "chuboxMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: "Chu Box"},
                {classes: "profileview-menu-button-count", name: "chuboxCount"}
            ]},
            {classes: "profileview-menu-button", value: 2, name: "friendsMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: "Following"},
                {classes: "profileview-menu-button-count", name: "friendCount"}
            ]},
            {classes: "profileview-menu-button", value: 3, name: "followersMenuButton", components: [
                {classes: "profileview-menu-button-caption", content: "Followers"},
                {classes: "profileview-menu-button-count", name: "followerCount"}
            ]}
        ]},
        {kind: "Panels", name: "panels", arrangerKind: "CarouselArranger", fit: true, draggable: false, components: [
            {kind: "List", name: "chuList", onSetupItem: "setupChu", classes: "enyo-fill", components: [
                {kind: "ListChu", ontap: "chuTapped"}
            ]},
            {kind: "Chubox", classes: "enyo-fill", onItemSelected: "chuboxItemSelected"},
            {kind: "List", name: "friendList", onSetupItem: "setupFriend", classes: "enyo-fill", components: [
                {kind: "onyx.Item", classes: "profileview-list-person", ontap: "friendTapped", components: [
                    {kind: "Image", classes: "miniavatar", name: "friendAvatar"},
                    {classes: "profileview-list-username ellipsis", name: "friendUsername"},
                    {kind: "onyx.Button", content: "follow", ontap: "toggleFollow", list: "friends", name: "friendFollowButton"}
                ]}
            ]},
            {kind: "List", name: "followerList", onSetupItem: "setupFollower", classes: "enyo-fill", components: [
                {kind: "onyx.Item", classes: "profileview-list-person", ontap: "followerTapped", components: [
                    {kind: "Image", classes: "miniavatar", name: "followerAvatar"},
                    {classes: "profileview-list-username ellipsis", name: "followerUsername"},
                    {kind: "onyx.Button", content: "follow", ontap: "toggleFollow", list: "followers", name: "followerFollowButton"}
                ]}
            ]}
        ]}
    ]
});