enyo.kind({
	name: "ProfileView",
	classes: "profileview",
	kind: "FittableColumns",
	published: {
		user: null, // Currently signed in user
		showedUser: null // User who's profile to show
	},
	showedUserChanged: function() {
		if (this.showedUser) {
			this.$.avatar.setSrc(this.showedUser.profile.avatar);
			this.$.fullName.setContent(this.showedUser.profile.first_name + " " + this.showedUser.profile.last_name);
			this.$.userName.setContent(this.showedUser.username);
			this.$.bio.setContent(this.showedUser.profile.bio);
		}
	},
	components: [
		{kind: "Scroller", fit: true, components: [
			{kind: "Image", classes: "profileview-avatar", name: "avatar"},
			{classes: "profileview-fullname", name: "fullName"},
			{classes: "profileview-username", name: "userName"},
			{classes: "profileview-bio", name: "bio"}
		]},
		{classes: "secondarypanels shadow-left"}
	]
});