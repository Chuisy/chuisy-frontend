/**
    _ComposeChu_ is a kind for creating new Chus. It consists of a location picker, a form for selecting
    price and category and a _ShareView_ for selecting visibility and sharing.
*/
enyo.kind({
    name: "ComposeChu",
    events: {
        // The user has tapped the back button
        onBack: "",
        // The user has gone through all stages and tapped the done button
        onDone: ""
    },
    published: {
        image: ""
    },
    clear: function() {
        this.$.panels.selectDirect(this.$.chuForm);
        this.chu = null;
        this.postingChu = false;
        this.$.pickStore.initialize();
        this.$.chuForm.clear();
        this.$.postView.clear();
    },
    imageChanged: function() {
        this.$.chuForm.setImage(this.image);
        this.$.postView.setImage(this.image);
    },
    // gotImage: function(uri) {
    //     // App.sendCubeEvent("get_image_success", {
    //     //     duration: new Date().getTime() - this.getImageTime.getTime()
    //     // });

    //     this.image = uri;

    //     // var user = chuisy.accounts.getActiveUser();
    //     // If user has activated sharing posts, make sure that we have publishing permissions.
    //     // If not, ask him again (if a certain period of time has passed)
    //     // if (user && user.profile.get("fb_og_share_posts")) {
    //     //     App.fbRequestPublishPermissions();
    //     // } else {
    //     //     App.optInSetting("fb_og_share_posts", $L("Share on Facebook"),
    //     //         $L("Do you want to share your Chus on Facebook? Some goodies can only be received if you share your stories! " +
    //     //             "You can change this later in your settings."), 7 * 24 * 60 * 60 * 1000, function(choice) {
    //     //             if (choice) {
    //     //                 App.fbRequestPublishPermissions();
    //     //             }
    //     //         });
    //     // }
    //     this.postChuTime = new Date();
    // },
    chuFormDone: function() {
        // this.$.panels.setIndex(1);
        this.$.panels.select(this.$.pickStore);
        this.$.pickStore.resized();
        this.pickStoreTime = new Date();
        return true;
    },
    storePicked: function (sender, event) {
        // App.sendCubeEvent("pick_store", {
        //     store: event.store,
        //     duration: this.pickStore ? new Date().getTime() - this.pickStoreTime.getTime() : undefined
        // });
        this.store = event.store;
        this.coordinates = event.coordinates;
        enyo.asyncMethod(this, function() {
            this.$.postView.setStore(this.store);
            this.$.panels.select(this.$.postView);
        });
        // this.$.chuForm.setStore(this.store);
        // enyo.Signals.send("onShowGuide", {view: "compose"});
    },
    chuFormBack: function() {
        // App.sendCubeEvent("post_chu_back", {
        //     duration: new Date().getTime() - this.postChuTime.getTime()
        // });
        this.doBack();
        if (event) {
            event.preventDefault();
        }
        return true;
    },
    pickStoreBack: function() {
        // App.sendCubeEvent("pick_store_back", {
        //     duration: new Date().getTime() - this.pickStoreTime.getTime()
        // });
        // this.$.panels.setIndex(0);
        this.$.panels.select(this.$.chuForm, AnimatedPanels.SLIDE_IN_FROM_LEFT, AnimatedPanels.SLIDE_OUT_TO_RIGHT);
        if (event) {
            event.preventDefault();
        }
        return true;
    },
    postViewBack: function() {
        // this.$.pickStore.initialize();
        this.$.panels.select(this.$.pickStore, AnimatedPanels.SLIDE_IN_FROM_LEFT, AnimatedPanels.SLIDE_OUT_TO_RIGHT);
        return true;
    },
    postViewDone: function() {
        this.postChu();
        return true;
    },
    postChu: function() {
        if (this.postingChu) {
            return true;
        }
        this.postingChu = true;

        // Prepare attributes
        var userMod = chuisy.accounts.getActiveUser();
        var user = userMod && userMod.toJSON();
        if (user) {
            user.profile.avatar_thumbnail = userMod.profile.get("avatar_thumbnail");
        }
        var visibility = this.$.postView.getVisibility();
        var friends = [];
        var friendsModels = this.$.postView.getFriends();
        for (var i=0; i<friendsModels.length; i++) {
            friends.push(friendsModels[i].toJSON());
        }
        var price = this.$.chuForm.getPrice();
        var locale = this.store.get("location") && this.store.get("location").cc; // Number formater for providing locale-specific currency formats
        var currFmt = new enyo.g11n.NumberFmt({style: "currency", currencyStyle: "iso", fractionDigits: 0, locale: locale && locale.toLowerCase()});
        var currency = currFmt.sign; // Local currency in iso code (e.g. EUR)
        var store = this.store.toStoreJSON();
        var latitude = this.coordinates && this.coordinates.latitude;
        var longitude = this.coordinates && this.coordinates.longitude;
        var like = this.$.postView.getLike();
        var comment = this.$.postView.getComment();
        var share = this.$.postView.getShareFacebook();

        var chu = chuisy.closet.create({
            user: user,
            visibility: visibility,
            friends: friends,
            price: price,
            price_currency: currency,
            store: store,
            latitude: latitude,
            longitude: longitude,
            liked: like,
            comment: comment,
            fb_og_share: share
        }, {at: 0});
        if (comment) {
            chu.comments.add(new chuisy.models.ChuComment({
                user: user,
                text: comment
            }));
        }
        chu.changeImage(this.image, enyo.bind(this, function() {
            if (App.isSignedIn()) {
                chuisy.closet.syncRecords();
            }
            this.doDone({chu: chu});
        }));

        // App.sendCubeEvent("post_chu", {
        //     chu: chu,
        //     duration: new Date().getTime() - this.postChuTime.getTime()
        // });
        return true;
    },
    activate: function() {
    },
    deactivate: function() {
    },
    components: [
        {kind: "AnimatedPanels", name: "panels", arrangerKind: "CarouselArranger", classes: "enyo-fill", draggable: false, components: [
            // STEP 1: Pick filter, price, category
            {kind: "ChuForm", onDone: "chuFormDone", onBack: "chuFormBack"},
            // STEP 2: Pick location/place from list
            {kind: "PickStore", onStorePicked: "storePicked", onBack: "pickStoreBack"},
            // STEP 3: Change visibility, share
            {kind: "PostView", onBack: "postViewBack", onDone: "postViewDone"}
            // {kind: "ShareView", classes: "enyo-fill", onDone: "shareViewDone", onBack: "shareViewBack"}
        ]}
    ]
});