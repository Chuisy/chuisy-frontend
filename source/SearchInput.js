enyo.kind({
	name: "SearchInput",
	kind: "onyx.InputDecorator",
	classes: "searchinput",
	alwaysLooksFocused: true,
	published: {
		value: "",
		changeDelay: 100
	},
	events: {
		onCancel: "",
		onChange: ""
	},
	valueChanged: function() {
		this.$.input.setValue(this.value);
	},
	getValue: function() {
		return this.$.input.getValue();
	},
	inputKeyup: function() {
		if (this.changeTimeout) {
			clearTimeout(this.changeTimeout);
		}

		if (this.getValue()) {
			this.addClass("active");
			this.changeTimeout = setTimeout(enyo.bind(this, function() {
				this.doChange({value: this.getValue()});
			}), this.changeDelay);
		} else {
			this.cancel();
		}
	},
	cancel: function() {
		this.$.input.setValue("");
		this.removeClass("active");
		this.doCancel();
	},
	components: [
        {kind: "onyx.Input", placeholder: "Type to search...", onkeyup: "inputKeyup"},
        {classes: "searchinput-icon", ontap: "cancel"}
	]
});