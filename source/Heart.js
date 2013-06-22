enyo.kind({
    name: "Heart",
    classes: "heart",
    animate: function() {

        this.startInAnimation();
        if (this.outAnimTimeout) {
            clearTimeout(this.outAnimTimeout);
        }
        this.outAnimTimeout = setTimeout(enyo.bind(this, this.startOutAnimation), 700);
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.hideTimeout = setTimeout(enyo.bind(this, function() {
            this.applyStyle("display", "none");
        }), 1200);
    },
    startInAnimation: function() {
        var x = 0;
        var y = 50;
        var rotX = 0;
        var rotY = 0;
        this.$.inner.applyStyle("-webkit-transition", "none");
        this.$.inner.applyStyle("-webkit-transform", "translate3d(" + x + "px, " + y + "px, 0) rotateX(" + rotX + "deg) rotateY(" + rotY +"deg)");
        this.$.inner.applyStyle("opacity", 0);
        this.applyStyle("display", "block");
        enyo.asyncMethod(this, function() {
            this.$.inner.applyStyle("-webkit-transition", "all 0.5s");
            this.$.inner.applyStyle("-webkit-transform", "");
            this.$.inner.applyStyle("opacity", 1);
        });
    },
    startOutAnimation: function() {
        var x = Math.random() * 100 - 50;
        var y = -50;
        var rotX = 50;
        var rotY = x/2;
        this.$.inner.applyStyle("-webkit-transform", "translate3d(" + x + "px, " + y + "px, 0) rotateX(" + rotX + "deg) rotateY(" + rotY +"deg)");
        this.$.inner.applyStyle("opacity", 0);
    },
    components: [
        {name: "inner", classes: "heart-inner"}
    ]
});

enyo.kind({
    name: "HeartTest",
    handlers: {
        ontap: "tap"
    },
    tap: function() {
        this.$.heart.animate();
    },
    components: [
        {kind: "Heart", classes: "absolute-center"}
    ]
});