enyo.kind({
    name: "LikeButton",
    classes: "like-button",
    kind: "Button",
    activeChanged: function() {
        this.addRemoveClass("active", this.active);
    },
    components: [
        {classes: "like-button-side back"},
        {classes: "like-button-side front"}
    ]
});