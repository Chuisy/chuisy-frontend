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
	notificationsUpdated: function(sender, event) {
		this.addRemoveClass("new-notifications", event.unseen_count);
	},
	components: [
		{classes: "menu-item feed", value: "feed", ontap: "itemTapped", name: "feed", active: true},
		{classes: "menu-item profile", value: "profile", ontap: "itemTapped", name: "profile"},
		{classes: "menu-item closet", value: "closet", ontap: "itemTapped", name: "closet"},
		{classes: "menu-item discover", value: "discover", ontap: "itemTapped", name: "discover"},
		{classes: "menu-item gifts", value: "gifts", ontap: "itemTapped", name: "gifts"},
		{classes: "menu-item notifications", value: "notifications", ontap: "itemTapped", name: "notifications"},
		{kind: "Signals", onNotificationsUpdated: "notificationsUpdated"}
	]
});