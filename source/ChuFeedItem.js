enyo.kind({
	name: "ChuFeedItem",
	classes: "chufeeditem",
	published: {
		chu: null
	},
	chuChanged: function() {
		if (this.chu) {
			this.$.image.setSrc(this.chu.thumbnails["300x300"]);
			this.$.avatar.setSrc(this.chu.user.profile.avatar_thumbnail);
			this.$.username.setContent(this.chu.user.username);
			this.$.time.setContent(chuisy.timeToText(this.chu.time));
		}
	},  
	components: [
		{kind: "Image", name: "image", classes: "chufeeditem-image"},
		{kind: "Image", classes: "chufeeditem-avatar miniavatar", name: "avatar"},
		{classes: "chufeeditem-username ellipsis", name: "username"},
		{classes: "chufeeditem-time", name: "time"}
	]
});