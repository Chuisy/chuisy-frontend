enyo.kind({
    name: "Spinner",
    classes: "spinner",
    published: {
        light: false,
        spinning: true
    },
    create: function() {
        this.inherited(arguments);
        this.lightChanged();
        this.spinningChanged();
    },
    lightChanged: function() {
        this.addRemoveClass("light", this.light);
    },
    spinningChanged: function() {
        this.addRemoveClass("spin", this.spinning);
    },
    components: [
        {classes: "spinner-wheel"}
    ]
});