enyo.kind({
    name: "ComposeChu",
    kind: "FittableRows",
    events: {
        onBack: "",
        onDone: ""
    },
    initialize: function() {
        this.chu = null;
        this.$.panels.setIndex(0);
        this.$.pickLocation.initialize();
        this.getImage();
    },
    getImage: function(callback) {
        try {
            // navigator.camera.cleanup();
            navigator.camera.getPicture(enyo.bind(this, this.gotImage), enyo.bind(this, function() {
                this.warn("Getting image failed!");
                this.doBack();
            }), {targetWidth: 768, targetHeight: 1024, correctOrientation: true, quality: 49});
        } catch (e) {
            this.warn("No camera available!");
            this.gotImage("");
        }
    },
    gotImage: function(uri) {
        this.image = uri;
        this.$.chuForm.clear();
        this.$.chuForm.setImage(this.image);
        // this.$.pickLocation.initialize();
    },
    locationPicked: function (sender, event) {
        this.location = event.location;
        this.$.panels.setIndex(1);
    },
    chuFormDone: function() {
        this.chu = this.chu || {};
        this.chu.visibility = this.chu.visibility || "private";
        this.chu.localImage = this.chu.localImage || this.image;
        this.chu.friends = this.chu.friends || [];
        this.chu.product = {
            price: Math.floor(this.$.chuForm.getPrice()),
            price_currency: "EUR",
            category: {
                name: this.$.chuForm.getCategory()
            }
        };
        this.chu.location = this.location;

        if (!chuisy.chubox.contains(this.chu)) {
            chuisy.chubox.add(this.chu, enyo.bind(this, function() {
                this.$.shareView.setChu(this.chu);
                this.$.panels.setIndex(2);
            }));
        } else {
            chuisy.chubox.update(this.chu);
            this.$.panels.setIndex(2);
        }
        return true;
    },
    chuFormBack: function() {
        this.$.panels.setIndex(0);
        return true;
    },
    shareViewDone: function() {
        this.doDone({chu: this.chu});
        return true;
    },
    shareViewBack: function() {
        this.$.panels.setIndex(1);
        return true;
    },
    components: [
        {kind: "Panels", fit: true, arrangerKind: "CarouselArranger", classes: "enyo-fill", draggable: false, components: [
            {kind: "PickLocation", classes: "enyo-fill", onLocationPicked: "locationPicked", onBack: "doBack"},
            {kind: "ChuForm", classes: "enyo-fill", onDone: "chuFormDone", onBack: "chuFormBack"},
            {kind: "ShareView", classes: "enyo-fill", onDone: "shareViewDone", onBack: "shareViewBack"}
        ]}
    ]
});