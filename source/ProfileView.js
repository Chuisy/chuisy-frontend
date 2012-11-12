enyo.kind({
    name: "ProfileView",
    kind: "FittableRows",
    classes: "profileview",
    published: {
        user: null
    },
    events: {
        onChuSelected: "",
        onChuboxItemSelected: "",
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
            this.loadChus(user);
            this.$.chubox.setUser(user);
            this.loadFriends(user);
            this.loadFollowers(user);
            this.$.followButton.addRemoveClass("active", user.following);
            this.$.chusMenuButton.setActive(true);
            this.$.panels.setIndex(0);
            this.addRemoveClass("owned", this.authUser && this.authUser.id == user.id);
        }
        this.$.menuButton.setShowing(this.user == "me");
        this.$.backButton.setShowing(this.user != "me");
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
        this.$.friendList.build();
    },
    setupFriend: function(sender, event) {
        var relation = this.friends[event.index];
        event.item.$.friendItem.setShowedUser(relation.followee);
        event.item.$.friendItem.setUser(this.user);
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
        event.item.$.followerItem.setShowedUser(relation.user);
        event.item.$.followerItem.setUser(this.user);
    },
    followerTapped: function(sender, event) {
        var user = this.followers[event.index].user;
        this.doShowProfile({user: user});
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
    // followingChanged: function(sender, event) {
    //     // var user = sender.getShowedUser();
    //     // this.log(user, event.following);
    //     // if (event.following) {
    //     //     this.friends.push(user);
    //     // } else {
    //     //     enyo.remove(user, this.friends);
    //     // }
    //     // this.log(this.friends);

    //     // this.refreshFriends();
    //     this.loadFriends("me" ? this.user : this.showedUser);
    // },
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