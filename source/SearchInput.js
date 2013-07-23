/**
    _SearchInput_ is an input with search and cancel controls that sends onChange events
    after key presses with a delay
*/
enyo.kind({
    name: "SearchInput",
    kind: "onyx.InputDecorator",
    tag: "form",
    classes: "searchinput",
    alwaysLooksFocused: true,
    published: {
        // Input value
        value: "",
        // Time that has to pass without input for _onChange_ event to be fired
        changeDelay: 100,
        // Set to true to disable input
        disabled: false,
        placeholder: $L("Search..."),
        searchEnterButton: true
    },
    events: {
        // User has tapped the x button
        onCancel: "",
        // Value has changed
        onChange: "",
        // User has hit the Enter key
        onEnter: ""
    },
    create: function() {
        this.inherited(arguments);
        this.valueChanged();
        this.disabledChanged();
        this.placeholderChanged();
        this.searchEnterButtonChanged();
    },
    valueChanged: function() {
        this.$.input.setValue(this.value);
    },
    disabledChanged: function() {
        this.$.input.setDisabled(this.disabled);
    },
    placeholderChanged: function() {
        this.$.input.setPlaceholder(this.placeholder);
    },
    searchEnterButtonChanged: function() {
        this.$.input.setType(this.searchEnterButton ? "search": "text")
    },
    /**
        Get the input value
    */
    getValue: function() {
        return this.$.input.getValue();
    },
    inputKeyup: function() {
        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }
        this.addClass("active");
        // Start timeout to fire onChange event if no new input happens in the meantime
        this.changeTimeout = setTimeout(enyo.bind(this, function() {
            this.doChange({value: this.getValue()});
        }), this.changeDelay);
    },
    /**
        Clears input and fire _onCancel_ events
    */
    cancel: function() {
        this.$.input.setValue("");
        this.removeClass("active");
        this.doCancel();
        this.blur();
        // Prevent tap event from propagating to elements below this element (bug in mobile safari)
        if (event) {
            event.preventDefault();
        }
        return true;
    },
    /**
        Blurs input field
    */
    blur: function() {
        this.$.input.hasNode().blur();
    },
    keypress: function(sender, event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            this.doEnter();
            return true;
        }
    },
    components: [
        {kind: "onyx.Input", onkeyup: "inputKeyup", onkeypress: "keypress", style: "-webkit-appearance: textfield"},
        {classes: "searchinput-icon", ontap: "cancel"}
    ]
});