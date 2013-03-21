enyo.kind({
	name: "FittingTextContainer",
	published: {
		maxFontSize: 50
	},
	handlers: {
		onpostresize: "fit"
	},
	contentChanged: function() {
		this.$.content.setContent(this.content);
		this.fit();
	},
	rendered: function() {
		this.inherited(arguments);
		this.fit();
	},
	fit: function() {
		if (this.hasNode()) {
			size = this.maxFontSize;
			do {
				this.$.content.applyStyle("font-size", size + "px");
				size--;
			} while (this.$.content.getBounds().height > this.getBounds().height || this.$.content.getBounds().width > this.getBounds().width);
		}
	},
	components: [
		{name: "content", tag: "span"}
	]
});