enyo.kind({
    name: "CssSpinner",
    classes: "cssspinner",
    // published: {
    //     lines: 13, // The number of lines to draw
    //     length: 10, // The length of each line
    //     width: 25, // The line thickness
    //     radius: 10, // The radius of the inner circle
    //     corners: 1, // Corner roundness (0..1)
    //     rotate: 0, // The rotation offset
    //     color: 'yellow', // #rgb or #rrggbb
    //     speed: 1.2, // Rounds per second
    //     trail: 50, // Afterglow percentage
    //     shadow: false, // Whether to render a shadow
    //     hwaccel: true, // Whether to use hardware acceleration
    //     className: 'spinner', // The CSS class to assign to the spinner
    //     zIndex: 2e9, // The z-index (defaults to 2000000000)
    //     top: 'auto', // Top position relative to parent in px
    //     left: 'auto' // Left position relative to parent in px
    // },
    published: {
        lines: 11, // The number of lines to draw
        length: 5, // The length of each line
        width: 2, // The line thickness
        radius: 4, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 30, // The rotation offset
        color: '#000', // #rgb or #rrggbb
        speed: 1.4, // Rounds per second
        trail: 75, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: true, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
    },
    linesChanged: function() {
        this.initSpinner();
    },
    lengthChanged: function() {
        this.initSpinner();
    },
    widthChanged: function() {
        this.initSpinner();
    },
    radiusChanged: function() {
        this.initSpinner();
    },
    cornersChanged: function() {
        this.initSpinner();
    },
    rotateChanged: function() {
        this.initSpinner();
    },
    colorChanged: function() {
        this.initSpinner();
    },
    speedChanged: function() {
        this.initSpinner();
    },
    trailChanged: function() {
        this.initSpinner();
    },
    shadowChanged: function() {
        this.initSpinner();
    },
    hwaccelChanged: function() {
        this.initSpinner();
    },
    classNameChanged: function() {
        this.initSpinner();
    },
    zIndexChanged: function() {
        this.initSpinner();
    },
    topChanged: function() {
        this.initSpinner();
    },
    leftChanged: function() {
        this.initSpinner();
    },
    getOpts: function() {
        return {
            lines: this.lines,
            length: this.length,
            width: this.width,
            radius: this.radius,
            corners: this.corners,
            rotate: this.rotate,
            color: this.color,
            speed: this.speed,
            trail: this.trail,
            shadow: this.shadow,
            hwaccel: this.hwaccel,
            className: this.className,
            zIndex: this.zIndex,
            top: this.top,
            left: this.left
        };
    },
    rendered: function() {
        this.inherited(arguments);
        this.initSpinner();
    },
    initSpinner: function() {
        if (this.hasNode) {
            var opts = this.getOpts();
            this.spinner = new Spinner(opts).spin(this.hasNode());
        }
    }
});