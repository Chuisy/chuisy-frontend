/**
    _SearchInput_ is an input with search and cancel controls that sends onChange events
    after key presses with a delay
*/
enyo.kind({
    name: "SearchInput",
    kind: "onyx.InputDecorator",
    classes: "searchinput",
    alwaysLooksFocused: true,
    published: {
        // Input value
        value: "",
        // Time that has to pass without input for _onChange_ event to be fired
        changeDelay: 100,
        // Set to true to disable input
        disabled: false
    },
    events: {
        // User has tapped the x button
        onCancel: "",
        // Value has changed
        onChange: ""
    },
    create: function() {
        this.inherited(arguments);
        this.valueChanged();
        this.disabledChanged();
    },
    valueChanged: function() {
        this.$.input.setValue(this.value);
    },
    disabledChanged: function() {
        this.$.input.setDisabled(this.disabled);
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

        if (this.getValue()) {
            this.addClass("active");
            // Start timeout to fire onChange event if no new input happens in the meantime
            this.changeTimeout = setTimeout(enyo.bind(this, function() {
                this.doChange({value: this.getValue()});
            }), this.changeDelay);
        } else {
            this.cancel();
        }
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
        event.preventDefault();
        return true;
    },
    /**
        Blurs input field
    */
    blur: function() {
        this.$.input.hasNode().blur();
    },
    components: [
        {kind: "onyx.Input", placeholder: $L("Type to search..."), onkeyup: "inputKeyup"},
        {classes: "searchinput-icon", ontap: "cancel"}
    ]
});