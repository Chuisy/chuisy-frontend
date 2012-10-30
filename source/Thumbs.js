enyo.kind({
	name: "Thumbs",
	kind: "Group",
	classes: "thumbs",
	published: {
		count: 3,
		index: 0
	},
	create: function() {
		this.inherited(arguments);
		this.countChanged();
	},
	countChanged: function() {
		this.destroyClientControls();
		for (var i=0; i<this.count; i++) {
			this.createComponent({kind: "GroupItem", classes: "thumbs-thumb"});
		}
		this.indexChanged();
		this.render();
	},
	indexChanged: function() {
		this.setActive(this.getControls()[this.index]);
	}
});