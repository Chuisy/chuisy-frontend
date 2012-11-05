enyo.kind({
	name: "UserListItem",
	kind: "onyx.Item",
	classes: "userlistitem",
	published: {
		showedUser: null,
		user: null
	},
	events: {
		onFollowingChanged: ""
	},
	userChanged: function() {
		this.$.followButton.setShowing(this.user && this.showedUser && this.user.id != this.showedUser.id);
	},
	showedUserChanged: function() {
		this.$.avatar.setSrc(this.showedUser.profile.avatar_thumbnail);
		this.$.username.setContent(this.showedUser.username);
		this.$.followButton.addRemoveClass("active", this.showedUser.following);
		this.$.followButton.setShowing(this.user && this.showedUser && this.user.id != this.showedUser.id);
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
                this.doFollowingChanged({following: false});
            }));
        } else {
            var params = {
                followee: user.resource_uri
            };
            chuisy.followingrelation.create(params, enyo.bind(this, function(sender, response) {
                user.following = response.id;
                button.setDisabled(false);
                button.addClass("active");
                this.doFollowingChanged({following: true});
            }));
        }
        return true;
    },
	components: [
        {kind: "Image", classes: "miniavatar", name: "avatar"},
        {classes: "userlistitem-username ellipsis", name: "username"},
        {kind: "onyx.Button", content: "follow", ontap: "toggleFollow", name: "followButton", classes: "userlistitem-follow-button"}
    ]
});