/**
    _UserListItem_ is a list control that displays a user. It includes a follow button for following/unfollowing a user
*/
enyo.kind({
	name: "UserListItem",
	classes: "list-item userlistitem pressable",
	published: {
        // The user to display
		user: null
	},
	events: {
        // Use was followed / unfollowed
		onToggleFollow: ""
	},
	update: function() {
		this.$.avatar.setSrc(this.user.profile.get("avatar_thumbnail") || "assets/images/avatar_thumbnail_placeholder.png");
		this.$.fullName.setContent(this.user.get("first_name") + " " + this.user.get("last_name"));
		this.$.followButton.setContent(this.user.get("following") ? $L("unfollow") : $L("follow"));
        var activeUser = chuisy.accounts.getActiveUser();
        this.$.followButton.setShowing(!activeUser || activeUser.id != this.user.id);
	},
    followButtonTapped: function() {
        if (App.checkConnection()) {
            App.requireSignIn(enyo.bind(this, this.doToggleFollow), "follow");
        }
        return true;
    },
	components: [
        {kind: "Image", classes: "userlistitem-avatar", name: "avatar"},
        {classes: "userlistitem-fullname ellipsis", name: "fullName"},
        {kind: "Button", content: $L("follow"), ontap: "followButtonTapped", name: "followButton", classes: "userlistitem-follow-button"}
    ]
});