/**
    _UserListItem_ is a list control that displays a user. It includes a follow button for following/unfollowing a user
*/
enyo.kind({
	name: "UserListItem",
	kind: "onyx.Item",
	classes: "userlistitem",
	published: {
        // The user to display
		user: null
	},
	events: {
        // Use was followed / unfollowed
		onToggleFollow: ""
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
            this.doToggleFollow();
        } else {
            // User is not signed in Ask him to sign in first
            enyo.Signals.send("onRequestSignIn", {
                success: enyo.bind(this, this.doToggleFollow)
            });
        }
        return true;
    },
	components: [
        {kind: "Image", classes: "userlistitem-avatar", name: "avatar"},
        {classes: "userlistitem-fullname ellipsis", name: "fullName"},
        {kind: "onyx.Button", content: "follow", ontap: "followButtonTapped", name: "followButton", classes: "userlistitem-follow-button"}
    ]
});