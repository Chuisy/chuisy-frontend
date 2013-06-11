enyo.kind({
    name: "Spinner",
    classes: "spinner",
    published: {
        light: false
    },
    create: function() {
        this.inherited(arguments);
        this.lightChanged();
    },
    lightChanged: function() {
        this.addRemoveClass("light", this.light);
    },
    components: [
        {classes: "spinner-wheel"}
    ]
});