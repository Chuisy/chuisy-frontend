enyo.kind({
	name: "ChuFeed",
	published: {
		user: null
	},
	userChanged: function() {
		this.loadChus();
	},
	loadChus: function() {
		chuisy.chu.list([["user", this.user.profile.id]], function(sender, response) {
			this.chus = response.objects;
			this.refreshChus();
		});
	},
	refreshChus: function() {
		this.$.chuList.setCount(this.chus.length);
		this.$.chuList.render();
	},
	setupChu: function(sender, event) {
		var item = this.chus[event.index];
		this.$.title.setContent(item.title);
	},
	components: [
		{kind: "List", name: "chuList", onSetupItem: "setupChu", components: [
			{name: "title"}
		]}
	]
});