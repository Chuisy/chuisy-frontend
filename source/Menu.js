/**
	_Menu_ is a menu bar for selecting among a couple of views
*/
enyo.kind({
	name: "Menu",
	kind: "Group",
	defaultKind: "GroupItem",
	classes: "menu header",
	events: {
		// View has been selected
		onChange: ""
	},
	create: function() {
		this.inherited(arguments);
		chuisy.notifications.on("reset seen", this.updateBadge, this);
	},
	selectItem: function(name) {
		if (this.$[name]) {
			this.$[name].setActive(true);
		}
	},
	itemTapped: function(sender, event) {
		sender.setActive(true);
		this.doChange({value: sender.value});
		// Prevent event from propagating to views lying below the respective element (bug in mobile safari)
		event.preventDefault();
	},
	updateBadge: function(sender, event) {
		var count = event && event.count || chuisy.notifications.getUnseenCount();
		this.addRemoveClass("new-notifications", count);
		if (count && this.$.badge.getContent() && this.$.badge.getContent() != count) {
			// alert("peng!");
			this.$.badge.applyStyle("-webkit-animation", "none");
			enyo.asyncMethod(this, function() {
				this.$.badge.applyStyle("-webkit-animation", "nudge 0.3s");
			});
		}
		this.$.badge.setContent(count);
		this.$.badge.addRemoveClass("two-digits", count > 9 &&  count < 100);
		this.$.badge.addRemoveClass("three-digits", count > 99);
	},
	components: [
		{classes: "menu-item feed", value: "feed", ontap: "itemTapped", name: "feed", active: true},
		{classes: "menu-item profile", value: "profile", ontap: "itemTapped", name: "profile"},
		{classes: "menu-item goodies", value: "goodies", ontap: "itemTapped", name: "goodies"},
		{classes: "menu-item notifications", value: "notifications", ontap: "itemTapped", name: "notifications", components: [
			{name: "badge", classes: "menu-notifications-badge"}
		]},
		{kind: "Signals", onUpdateBadge: "updateBadge"}
	]
});