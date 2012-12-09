enyo.kind({
	name: "UserListItem",
	kind: "onyx.Item",
	classes: "userlistitem",
	published: {
		user: null
	},
	events: {
		onFollowingChanged: ""
	},
	userChanged: function() {
		this.$.avatar.setSrc(this.user.profile.avatar_thumbnail || "");
		this.$.fullName.setContent(this.user.first_name + " " + this.user.last_name);
		this.$.followButton.setContent(this.user.following ? "unfollow" : "follow");
        var authUser = chuisy.getSignInStatus().user;
        this.$.followButton.setShowing(!authUser || authUser.id != this.user.id);
	},
    followButtonTapped: function() {
        if (chuisy.getSignInStatus().signedIn) {
            this.toggleFollow();
        } else {
            enyo.Signals.send("onRequestSignIn", {
                success: enyo.bind(this, this.toggleFollow)
            });
        }
        return true;
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
                this.doFollowingChanged({following: false});
            }));
        } else {
            var params = {
                followee: user.resource_uri
            };
            chuisy.followingrelation.create(params, enyo.bind(this, function(sender, response) {
                user.following = response.id;
                button.setDisabled(false);
                this.doFollowingChanged({following: true});
            }));
        }
        return true;
    },
	components: [
        {kind: "Image", classes: "userlistitem-avatar", name: "avatar"},
        {classes: "userlistitem-fullname ellipsis", name: "fullName"},
        {kind: "onyx.Button", content: "follow", ontap: "followButtonTapped", name: "followButton", classes: "userlistitem-follow-button"}
    ]
});