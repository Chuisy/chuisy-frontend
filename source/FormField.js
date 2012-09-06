enyo.kind({
	name: "FormField",
	kind: "onyx.InputDecorator",
	classes: "formfield",
	published: {
		type: "",
		required: false,
		//label: "",
		valid: null,
		errorMessage: "",
		placeholder: ""
	},
	requiredChanged: function() {
		this.addRemoveClass("formfield-required", this.required);
	},
	typeChanged: function() {
		this.$.input.setType(this.type);
	},
	placeholderChanged: function() {
		this.$.input.setPlaceholder(this.placeholder);
	},
	validChanged: function() {
		this.addRemoveClass("invalid", this.valid === false);
		this.addRemoveClass("valid", this.valid === true);
		this.$.errorMessage.setShowing(this.valid === false);
	},
	errorMessageChanged: function() {
		this.$.errorMessage.setContent(this.errorMessage);
	},
	create: function() {
		this.inherited(arguments);
		this.requiredChanged();
		this.typeChanged();
		this.placeholderChanged();
		this.validChanged();
		this.errorMessageChanged();
	},
	getValue: function(value) {
		return this.$.input.getValue(value);
	},
	setValue: function(value) {
		return this.$.input.setValue(value);
	},
	components: [
		{name: "errorMessage", classes: "formfield-errormessage", showing: false},
		{kind: "onyx.Input", name: "input"}
	]
});