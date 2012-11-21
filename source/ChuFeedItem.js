enyo.kind({
	name: "ChuFeedItem",
	classes: "chufeeditem",
	published: {
		chu: null
	},
	events: {
		onUserTapped: ""
	},
	chuChanged: function() {
		if (this.chu) {
			this.$.image.applyStyle("background-image", "url(" + (this.chu.thumbnails["300x300"] || this.chu.image || "assets/images/chu_placeholder.png") + ")");
			this.$.avatar.setSrc(this.chu.user.profile.avatar_thumbnail || this.chu.user.profile.avatar || "assets/images/avatar_placeholder.png");
			this.$.username.setContent(this.chu.user.username);
			this.$.time.setContent(chuisy.timeToText(this.chu.time));
			this.$.likesCount.setContent(this.chu.likes_count);
			this.$.commentsCount.setContent(this.chu.comments_count);
		}
	},
	showUser: function() {
		this.doUserTapped();
		return true;
	},
	components: [
		{name: "image", classes: "chufeeditem-image"},
		{classes: "chufeeditem-likes-comments", components: [
			{classes: "chufeeditem-likes", components: [
				{classes: "chufeeditem-likes-count", name: "likesCount"},
				{classes: "chufeeditem-likes-icon"}
			]},
			{classes: "chufeeditem-comments", components: [
				{classes: "chufeeditem-comments-count", name: "commentsCount"},
				{classes: "chufeeditem-comments-icon"}
			]}
		]},
		{kind: "Image", classes: "chufeeditem-avatar", name: "avatar", ontap: "showUser"},
		{classes: "chufeeditem-username ellipsis", name: "username", ontap: "showUser"},
		{classes: "chufeeditem-time", name: "time"}
	]
});