enyo.kind({
	name: "Guide",
	classes: "guide",
	published: {
		view: ""
	},
	handlers: {
		ontap: "next"
	},
	views: {
		"feed": [
			{style: "background-image: url(assets/images/guide_feed_1.png)"},
			{style: "background-image: url(assets/images/guide_feed_2.png)"}
		]
	},
	create: function() {
		this.inherited(arguments);
		this.$.panels.getAnimator().setDuration(800);
	},
	viewChanged: function() {
		this.$.panels.destroyClientControls();
		this.$.panels.createComponents(this.views[this.view] || []);
		this.$.panels.render();
	},
	open: function() {
		this.$.panels.setIndex(0);
		this.applyStyle("z-index", 1000);
		this.addClass("open");
	},
	close: function() {
		this.removeClass("open");
		setTimeout(enyo.bind(this, function() {
			this.applyStyle("z-index", -1000);
		}), 500);
	},
	next: function() {
		var currIndex = this.$.panels.getIndex();
		if (currIndex < this.$.panels.getPanels().length-1) {
			this.$.panels.setIndex(currIndex + 1);
		} else {
			this.close();
		}
	},
	components: [
		{kind: "Panels", classes: "enyo-fill guide-panels", components: [{}]},
		{classes: "guide-continue-text", content: "(tap to continue)"}
	]
});