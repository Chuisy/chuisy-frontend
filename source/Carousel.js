enyo.kind({
    name: "Carousel",
    classes: "carousel",
    handlers: {
        ondrag: "drag",
        ondragstart: "dragstart",
        ondragfinish: "dragfinish"
    },
    published: {
        index: 0
    },
    events: {
        onTransitionStart: ""
    },
    rendered: function() {
        this.inherited(arguments);
        this.indexChanged();
    },
    indexChanged: function() {
        this.offset = -this.index * this.getBounds().width;
        this.$.client.applyStyle("-webkit-transform", "translate3d(" + this.offset + "px, 0, 0)");
    },
    dragstart: function(sender, event) {
        this.$.client.applyStyle("-webkit-transition", "none");
    },
    drag: function(sender, event) {
        this.dx = event.dx;
        this.$.client.applyStyle("-webkit-transform", "translate3d(" + (this.offset + this.dx) + "px, 0, 0)");
    },
    dragfinish: function(sender, event) {
        var dur = 1000 * (1-Math.abs(this.dx)/this.getBounds().width) * (1-Math.abs(event.ddx)/150);
        this.$.client.applyStyle("-webkit-transition", "-webkit-transform " + dur + "ms");
        if (this.dx < 0 && this.index < this.getClientControls().length-1) {
            this.doTransitionStart({fromIndex: this.index, toIndex: this.index+1});
            this.setIndex(this.index + 1);
        } else if (this.dx > 0 && this.index > 0) {
            this.doTransitionStart({fromIndex: this.index, toIndex: this.index-1});
            this.setIndex(this.index -1);
        } else {
            this.indexChanged();
        }
    },
    components: [
        {name: "client", classes: "carousel-sliding-client", style: "-webkit-transition: -webkit-transform 1000ms"}
    ]
});

enyo.kind({
    name: "CarouselTest",
    components: [
        {kind: "Carousel", classes: "enyo-fill", components: [
            {style: "background-color: red"},
            {style: "background-color: blue"},
            {style: "background-color: green"}
        ]}
    ]
});