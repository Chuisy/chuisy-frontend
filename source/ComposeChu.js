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
            }), {targetWidth: 612, targetHeight: 612, allowEdit: true, correctOrientation: true, quality: 49});
        } catch (e) {
            this.warn("No camera available!");
            this.gotImage("");
        }
    },
    gotImage: function(uri) {
        this.image = uri;
        this.$.chuForm.setImage(this.image);
        
        var user = chuisy.accounts.getActiveUser();
        if (App.isSignedIn() && navigator.notification) {
            if (!localStorage.getItem("chuisy.hasAskedForOgShare")) {
                navigator.notification.confirm($L("Do you want to Chuisy to post your actions on Facebook? You can change this later in your settings."), enyo.bind(this, function(choice) {
                    var share = choice == 1 ? false : true;
                    user.profile.set("fb_og_share_actions", share);
                    user.save();
                    chuisy.accounts.syncActiveUser();
                    if (share) {
                        App.fbRequestPublishPermissions();
                    }
                }), $L("Share on Facebook"), [$L("No"), $L("Yes")].join(","));
                localStorage.setItem("chuisy.hasAskedForOgShare", new Date().getTime());
            } else if (user.profile.get("fb_og_share_actions")) {
                App.fbRequestPublishPermissions();
            }
        }
        // this.$.pickLocation.initialize();
    },
    locationPicked: function (sender, event) {
        this.location = event.location;
        this.coordinates = event.coordinates;
        this.$.chuForm.setLocation(this.location);
        this.$.panels.setIndex(1);
        enyo.Signals.send("onShowGuide", {view: "compose"});
    },
    chuFormDone: function() {
        var user = chuisy.accounts.getActiveUser();
        var attrs = {
            visibility: "public",
            user: user
        };
        // Number formater for providing locale-specific currency formats
        var currFmt = new enyo.g11n.NumberFmt({style: "currency", currencyStyle: "iso"});
        attrs.price = this.$.chuForm.getPrice();
        // Specify the local currencies iso code (e.g. EUR)
        attrs.price_currency = currFmt.sign;
        attrs.location = this.location.toJSON();
        var chu = chuisy.closet.create(attrs, {at: 0});
        chu.changeImage(this.image, enyo.bind(this, function() {
            if (App.isSignedIn()) {
                chuisy.closet.syncRecords();
            }
            this.doDone({chu: chu});
        }));
    },
    chuFormBack: function() {
        this.$.panels.setIndex(0);
        return true;
    },
    // shareViewDone: function() {
    //     this.doDone({chu: this.chu});
    //     return true;
    // },
    // shareViewBack: function() {
    //     this.$.panels.setIndex(1);
    //     return true;
    // },
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
            {kind: "ChuForm", classes: "enyo-fill", onDone: "chuFormDone", onBack: "chuFormBack"}
            // STAGE 3: Change visibility, share
            // {kind: "ShareView", classes: "enyo-fill", onDone: "shareViewDone", onBack: "shareViewBack"}
        ]}
    ]
});