enyo.kind({
	name: "App",
	fit: true,
	kind: "FittableRows",
	classes: "app",
	narrowWidth: 600,
	published: {
		menuShowing: true,
		infoSliderShowing: true
	},
	isNarrow: function() {
		return this.getBounds().width < this.narrowWidth;
	},
	menuShowingChanged: function() {
		this.$.menuButton.addRemoveClass("active", this.menuShowing);
		this.$.appPanels.setIndex(this.menuShowing ? 0 : 1);
	},
	infoSliderShowingChanged: function() {
		this.$.infoSliderButton.addRemoveClass("active", this.infoSliderShowing);
		if (this.infoSliderShowing) {
			this.$.infoSlider.animateToMin();
		} else {
			this.$.infoSlider.animateToMax();
		}
	},
	rendered: function() {
		this.inherited(arguments);
		this.setMenuShowing(!this.isNarrow());
		this.resizeHandler();
	},
	toggleMenu: function() {
		this.setMenuShowing(!this.menuShowing);
	},
	toggleInfoSlider: function() {
		this.setInfoSliderShowing(!this.infoSliderShowing);
	},
	resizeHandler: function() {
		this.inherited(arguments);
		var narrow = this.isNarrow();
		this.addRemoveClass("narrow", narrow);
		this.$.contentPanel.setFit(!narrow);
		this.$.infoSlider.setMin(narrow ? -200 : 0);
		this.$.infoSlider.setMax(narrow ? 10 : 0);
		this.$.infoSliderButton.setShowing(narrow);
		this.$.mainPanel.render();
		this.setInfoSliderShowing(!narrow);
	},
	components: [
		{classes: "main-header", kind: "FittableColumns", components: [
			{kind: "onyx.Button", classes: "active", name: "menuButton", ontap: "toggleMenu", components: [
				{kind: "Image", src: "assets/images/menu-icon.png"}
			]},
			{classes: "main-header-text", fit: true, content: "chuisy"},
			{kind: "onyx.Button", name: "infoSliderButton", ontap: "toggleInfoSlider", components: [
				{kind: "Image", src: "assets/images/menu-icon.png"}
			]}
		]},
		{kind: "Panels", name: "appPanels", fit: true, classes: "app-panels", narrowFit: false, realtimeFit: true,
			arrangerKind: "CollapsingArranger", components: [
			{classes: "main-menu bg-light", style: "text-align: center; padding: 200px 0; font-size: 20pt;", content: "menu"},
			{classes: "main-panel bg-light", name: "mainPanel", kind: "FittableRows", components: [
				{classes: "fading-separator"},
				{kind: "FittableColumns", fit: true, components: [
					{fit: false, style: "width: 100%; text-align: center; padding: 200px 0; font-size: 20pt;", name: "contentPanel", content: "content"},
					{kind: "Slideable", classes: "bg-light", min: -200, max: 10, value: 10, unit: "px", overMoving: false, preventDragPropagation: true, style: "width: 200px;",
						name: "infoSlider", components: [
						{classes: "fading-separator"},
						{style: "text-align: center; padding: 200px 0; font-size: 20pt;", content: "info slider"}
					]}
				]}
			]}
		]}
	]
});
