/**
    _ComposeChu_ is a kind for creating new Chus. It consists of a location picker, a form for selecting
    price and category and a _ShareView_ for selecting visibility and sharing.
*/
enyo.kind({
    name: "ComposeChu",
    kind: "FittableRows",
    events: {
        // The user has tapped the back button
        onBack: "",
        // The user has gone through all stages and tapped the done button
        onDone: ""
    },
    create: function() {
        this.inherited(arguments);
        if (navigator.camera) {
            // Clean up temporary pictures
            navigator.camera.cleanup();
        }
    },
    /**
        Opens the device's camera
    */
    getImage: function(callback) {
        try {
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
        this.$.chuForm.setImage(this.image);
        // this.$.pickLocation.initialize();
    },
    locationPicked: function (sender, event) {
        this.location = event.location;
        this.$.panels.setIndex(1);
        enyo.Signals.send("onShowGuide", {view: "compose"});
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

        // Disable done button to prevent double-posts
        this.$.chuForm.setDoneButtonDisabled(true);
        if (!chuisy.chubox.contains(this.chu)) {
            // Chu hasn't been saved yet. Create it.
            chuisy.chubox.add(this.chu, enyo.bind(this, function() {
                this.$.chuForm.setDoneButtonDisabled(false);
                this.$.panels.setIndex(2);
                this.$.shareView.activate(this.chu);
            }));
        } else {
            // Chu has already been saved. Update it!
            chuisy.chubox.update(this.chu);
            this.$.chuForm.setDoneButtonDisabled(false);
            this.$.panels.setIndex(2);
            this.$.shareView.activate(this.chu);
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
    activate: function() {
        this.chu = null;
        this.$.panels.setIndex(0);
        this.$.pickLocation.initialize();
        this.$.chuForm.clear();
        this.getImage();
    },
    deactivate: function() {},
    components: [
        {kind: "Panels", fit: true, arrangerKind: "CarouselArranger", classes: "enyo-fill", draggable: false, components: [
            // STAGE 1: Pick location/place from list
            {kind: "PickLocation", classes: "enyo-fill", onLocationPicked: "locationPicked", onBack: "doBack"},
            // STAGE 2: Pick filter, price, category
            {kind: "ChuForm", classes: "enyo-fill", onDone: "chuFormDone", onBack: "chuFormBack"},
            // STAGE 3: Change visibility, share
            {kind: "ShareView", classes: "enyo-fill", onDone: "shareViewDone", onBack: "shareViewBack"}
        ]}
    ]
});