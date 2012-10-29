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
    },
    showedUserChanged: function() {
        if (this.showedUser) {
            this.$.avatar.setSrc(this.showedUser.profile.avatar);
            this.$.fullName.setContent(this.showedUser.first_name + " " + this.showedUser.last_name);
            this.$.userName.setContent(this.showedUser.username);
            this.$.bio.setContent(this.showedUser.profile.bio);
            this.loadChus();
            this.$.chubox.setBoxOwner(this.showedUser);
            this.loadFriends();
            this.loadFollowers();
            this.$.followButton.addRemoveClass("active", this.showedUser.following);
            this.$.chusMenuButton.setActive(true);
            this.$.panels.setIndex(0);
        }
    },
    loadChus: function() {
        chuisy.chu.list([["user", this.showedUser.id]], enyo.bind(this, function(sender, response) {
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
    loadFriends: function() {
        chuisy.followingrelation.list([["user", this.showedUser.id]], enyo.bind(this, function(sender, response) {
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
        this.$.friendAvatar.setSrc(relation.followee.profile.avatar);
        this.$.friendUsername.setContent(relation.followee.username);
        this.$.friendFollowButton.addRemoveClass("active", relation.followee.following);
    },
    friendTapped: function(sender, event) {
        var user = this.friends[event.index].followee;
        this.doShowProfile({user: user});
    },
    loadFollowers: function() {
        chuisy.followingrelation.list([["followee", this.showedUser.id]], enyo.bind(this, function(sender, response) {
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
        this.$.followerAvatar.setSrc(relation.user.profile.avatar);
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
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
            {classes: "mainheader-text", content: "Profile"}
        ]},
        {classes: "provileview-info", components: [
            {kind: "Image", classes: "profileview-avatar", name: "avatar"},
            {classes: "profileview-profileinfo", components: [
                {classes: "profileview-fullname", name: "fullName"},
                {classes: "profileview-username", name: "userName"},
                {classes: "profileview-bio", name: "bio"}
            ]},
            {kind: "onyx.Button", name: "followButton", content: "follow", ontap: "toggleFollow"}
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
                    {kind: "Image", classes: "profileview-list-avatar", name: "friendAvatar"},
                    {classes: "profileview-list-username", name: "friendUsername"},
                    {kind: "onyx.Button", content: "follow", ontap: "toggleFollow", list: "friends", name: "friendFollowButton"}
                ]}
            ]},
            {kind: "List", name: "followerList", onSetupItem: "setupFollower", classes: "enyo-fill", components: [
                {kind: "onyx.Item", classes: "profileview-list-person", ontap: "followerTapped", components: [
                    {kind: "Image", classes: "profileview-list-avatar", name: "followerAvatar"},
                    {classes: "profileview-list-username", name: "followerUsername"},
                    {kind: "onyx.Button", content: "follow", ontap: "toggleFollow", list: "followers", name: "followerFollowButton"}
                ]}
            ]}
        ]}
    ]
});