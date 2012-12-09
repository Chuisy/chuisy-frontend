/**
	_ChuFeedItem_ is used as an element in the chu feed.
*/
enyo.kind({
	name: "ChuFeedItem",
	classes: "chufeeditem",
	published: {
		//* Chu to display
		chu: null
	},
	events: {
		//* The chus avatar or name was tapped
		onUserTapped: ""
	},
	chuChanged: function() {
		if (this.chu) {
			this.$.image.applyStyle("background-image", "url(" + (this.chu.thumbnails["300x300"] || this.chu.image || "assets/images/chu_placeholder.png") + ")");
			this.$.avatar.setSrc(this.chu.user.profile.avatar_thumbnail || this.chu.user.profile.avatar || "assets/images/avatar_placeholder.png");
			this.$.fullName.setContent(this.chu.user.first_name + " " + this.chu.user.last_name);
			this.$.time.setContent(chuisy.timeToText(this.chu.time));
			this.$.likesCount.setContent(this.chu.likes_count);
			this.$.commentsCount.setContent(this.chu.comments_count);
			// this.$.categoryIcon.applyStyle("background-image", "url(assets/images/category_" + this.chu.product.category.name + ".png)");
		}
	},
	showUser: function() {
		this.doUserTapped();
		return true;
	},
	components: [
		{name: "image", classes: "chufeeditem-image"},
        {classes: "chufeeditem-likes-comments", components: [
            {classes: "chufeeditem-likes-count", name: "likesCount"},
            {classes: "chufeeditem-likes-icon"},
            {classes: "chufeeditem-comments-count", name: "commentsCount"},
            {classes: "chufeeditem-comments-icon"}
        ]},
		{kind: "Image", classes: "chufeeditem-avatar", name: "avatar", ontap: "showUser"},
		{classes: "chufeeditem-fullname ellipsis", name: "fullName", ontap: "showUser"},
		{classes: "chufeeditem-time", name: "time"}
	]
});