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
        this.getImageTime = new Date();
        try {
            navigator.camera.getPicture(enyo.bind(this, this.gotImage), enyo.bind(this, function(message) {
                this.warn("Getting image failed!");
                App.sendCubeEvent("get_image_fail", {
                    message: message,
                    duration: new Date().getTime() - this.getImageTime.getTime()
                });
                this.doBack();
            }), {targetWidth: 612, targetHeight: 612, allowEdit: true, correctOrientation: true, quality: 49});
        } catch (e) {
            this.warn("No camera available!");
            this.gotImage("");
        }
    },
    gotImage: function(uri) {
        App.sendCubeEvent("get_image_success", {
            duration: new Date().getTime() - this.getImageTime.getTime()
        });

        this.image = uri;
        this.$.chuForm.setImage(this.image);

        var user = chuisy.accounts.getActiveUser();
        // If user has activated sharing posts, make sure that we have publishing permissions.
        // If not, ask him again (if a certain period of time has passed)
        if (user && user.profile.get("fb_og_share_posts")) {
            App.fbRequestPublishPermissions();
        } else {
            App.optInSetting("fb_og_share_posts", $L("Share on Facebook"),
                $L("Do you want to share your Chus on Facebook? Some goodies can only be received if you share your stories! " +
                    "You can change this later in your settings."), 7 * 24 * 60 * 60 * 1000, function(choice) {
                    if (choice) {
                        App.fbRequestPublishPermissions();
                    }
                });
        }

        this.$.pickLocation.initialize();
        this.pickLocationTime = new Date();
    },
    locationPicked: function (sender, event) {
        App.sendCubeEvent("pick_store", {
            store: event.location,
            duration: this.pickLocation ? new Date().getTime() - this.pickLocationTime.getTime() : undefined
        });
        this.location = event.location;
        this.coordinates = event.coordinates;
        this.$.chuForm.setLocation(this.location);
        this.postChuTime = new Date();
        this.$.panels.setIndex(1);
        // enyo.Signals.send("onShowGuide", {view: "compose"});
    },
    chuFormDone: function() {
        if (this.postingChu) {
            return true;
        }
        this.postingChu = true;

        var user = chuisy.accounts.getActiveUser();
        var attrs = {
            visibility: App.isSignedIn() ? "public" : "private",
            user: user
        };
        // Number formater for providing locale-specific currency formats
        var locale = this.location.get("location").cc;
        var currFmt = new enyo.g11n.NumberFmt({style: "currency", currencyStyle: "iso", fractionDigits: 0, locale: locale && locale.toLowerCase()});
        attrs.price = this.$.chuForm.getPrice();
        // Specify the local currencies iso code (e.g. EUR)
        attrs.price_currency = currFmt.sign;
        attrs.location = this.location.toLocJSON();
        attrs.latitude = this.coordinates && this.coordinates.latitude;
        attrs.longitude = this.coordinates && this.coordinates.longitude;
        var chu = chuisy.closet.create(attrs, {at: 0});
        chu.changeImage(this.image, enyo.bind(this, function() {
            if (App.isSignedIn()) {
                chuisy.closet.syncRecords();
            }
            this.doDone({chu: chu});
        }));

        App.sendCubeEvent("post_chu", {
            chu: chu,
            duration: new Date().getTime() - this.postChuTime.getTime()
        });
        return true;
    },
    pickLocationBack: function() {
        App.sendCubeEvent("pick_store_back", {
            duration: new Date().getTime() - this.pickLocationTime.getTime()
        });
        this.doBack();
    },
    chuFormBack: function() {
        App.sendCubeEvent("post_chu_back", {
            duration: new Date().getTime() - this.postChuTime.getTime()
        });
        this.$.panels.setIndex(0);
        return true;
    },
    activate: function() {
        this.chu = null;
        this.postingChu = false;
        this.$.panels.setIndex(0);
        this.$.pickLocation.initialize();
        this.$.chuForm.clear();
        this.getImage();
    },
    deactivate: function() {},
    components: [
        {kind: "Panels", fit: true, arrangerKind: "CarouselArranger", classes: "enyo-fill", draggable: false, components: [
            // STAGE 1: Pick location/place from list
            {kind: "PickLocation", classes: "enyo-fill", onLocationPicked: "locationPicked", onBack: "pickLocationBack"},
            // STAGE 2: Pick filter, price, category
            {kind: "ChuForm", classes: "enyo-fill", onDone: "chuFormDone", onBack: "chuFormBack"}
            // STAGE 3: Change visibility, share
            // {kind: "ShareView", classes: "enyo-fill", onDone: "shareViewDone", onBack: "shareViewBack"}
        ]}
    ]
});