enyo.kind({
	name: "ItemCluster",
	kind: "onyx.Item",
	classes: "itemcluster",
	published: {
		items: []
	},
	itemsChanged: function() {
		var user = this.items[0].user;
		var time = this.items[0].time;

		this.$.avatar.setSrc(user.profile.avatar_thumbnail);
		// this.$.username.setContent(user.username);
		this.$.text.setContent(user.username + " has added " + this.items.length + " items to his Chu Box");
		for (var i=0; i<3; i++) {
			this.setupItem(i);
		}
        this.$.time.setContent(chuisy.timeToText(this.items[this.items.length-1].time));
	},
	setupItem: function(index) {
		var item = this.items[index];
		var itemComp = this.$["item" + index];
		if (item && itemComp) {
			itemComp.applyStyle("visibility", "visible");
			itemComp.setSrc(item.thumbnails["100x100"] || item.image);
		} else if (itemComp) {
			itemComp.applyStyle("visibility", "hidden");
		}
	},
	components: [
		{components: [
			{kind: "Image", name: "avatar", classes: "miniavatar itemcluster-avatar"},
			// {name: "username", classes: "itemcluster-username ellipsis"},
			{name: "text", classes: "itemcluster-text"}
		]},
		{style: "text-align: center", components: [
            {kind: "Image", classes: "itemcluster-item", name: "item0"},
            {kind: "Image", classes: "itemcluster-item", name: "item1"},
            {kind: "Image", classes: "itemcluster-item", name: "item2"}
		]},
		{name: "time"}
	]
});