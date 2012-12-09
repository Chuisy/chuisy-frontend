enyo.kind({
    name: "ComposeChu",
    kind: "FittableRows",
    events: {
        onBack: "",
        onChuPosted: ""
    },
    initialize: function() {
        this.$.panels.setIndex(0);
        this.getImage();
    },
    getImage: function(callback) {
        try {
            navigator.camera.cleanup();
            navigator.camera.getPicture(enyo.bind(this, this.gotImage), enyo.bind(this, function() {
                this.warn("Getting image failed!");
                this.doBack();
            }), {targetWidth: 768, targetHeight: 1024, correctOrientation: true});
        } catch (e) {
            this.warn("No camera available!");
            this.gotImage("");
        }
    },
    gotImage: function(uri) {
        this.$.chuForm.clear();
        this.$.chuForm.setImage(uri);
        this.$.pickLocation.initialize();
    },
    locationPicked: function (sender, event) {
        this.location = event.location;
        this.$.panels.setIndex(1);
    },
    submit: function() {
        var chu = this.$.chuForm.getData();
        chu.location = this.location;
        chuisy.chubox.add(chu);
        this.doChuPosted({chu: chu});
    },
    chuFormBack: function() {
        this.$.panels.setIndex(0);
        return true;
    },
    components: [
        {kind: "Panels", fit: true, arrangerKind: "CarouselArranger", classes: "enyo-fill", draggable: false, components: [
            {kind: "PickLocation", classes: "enyo-fill", onLocationPicked: "locationPicked", onBack: "doBack"},
            {kind: "ChuForm", classes: "enyo-fill", onSubmit: "submit", onBack: "chuFormBack"}
        ]}
    ]
});