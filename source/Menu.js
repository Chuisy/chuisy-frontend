enyo.kind({
	name: "Menu",
	kind: "Group",
	defaultKind: "GroupItem",
	classes: "menu header",
	events: {
		onChange: ""
	},
	selectItem: function(sender, event) {
		sender.setActive(true);
		this.doChange({value: sender.value});
	},
	notificationsUpdated: function(sender, event) {
		this.addRemoveClass("new-notifications", event.unseen_count);
	},
	components: [
		{classes: "menu-item feed", value: "feed", ontap: "selectItem", active: true},
		{classes: "menu-item profile", value: "profile", ontap: "selectItem"},
		{classes: "menu-item chubox", value: "chubox", ontap: "selectItem"},
		{classes: "menu-item discover", value: "discover", ontap: "selectItem"},
		{classes: "menu-item gifts", value: "gifts", ontap: "selectItem"},
		{classes: "menu-item notifications", value: "notifications", ontap: "selectItem"},
		{kind: "Signals", onNotificationsUpdated: "notificationsUpdated"}
	]
});