enyo.kind({
    name: "PostView",
    classes: "postview",
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.log("***** create *****");
        this.inherited(arguments);
        this.setupFriends();
    },
    visibilitySelected: function(sender, event) {
        sender.setActive(true);
    },
    toggleFacebook: function() {
        // this.$.facebookButton.setActive(!this.$.facebookButton.getActive());
        this.shareFacebook = !this.shareFacebook;
        this.$.facebookButton.addRemoveClass("active", this.shareFacebook);
    },
    openPeoplePicker: function() {
        this.$.panels.select(this.$.peoplePicker, AnimatedPanels.SLIDE_IN_FROM_BOTTOM, "shiftOut");
        this.$.peoplePicker.resized();
        event.preventDefault();
        return true;
    },
    peoplePickerDone: function() {
        this.$.panels.select(this.$.formView, "shiftIn", AnimatedPanels.SLIDE_OUT_TO_BOTTOM);
        this.$.shareCount.setContent(this.$.peoplePicker.getSelectedItems().length || "");
        event.preventDefault();
        return true;
    },
    setupFriends: function() {
        var user = chuisy.accounts.getActiveUser();
        this.log(user.friends);
        if (user) {
            this.$.peoplePicker.setItems(user.friends.models);
            // this.$.friendsPanels.setIndex(user.friends.length ? 0 : 1);
            this.listenTo(user.friends, "sync", function() {
                this.log("**** sync! *****");
                this.$.peoplePicker.setItems(user.friends.models);
                this.$.peoplePicker.itemsChanged();
                // this.$.friendsPanels.setIndex(user.friends.length ? 0 : 1);
            });
        }
    },
    components: [
        {kind: "AnimatedPanels", name: "panels", classes: "enyo-fill", components: [
            {name: "formView", kind: "FittableRows", components: [
                {classes: "header", components: [
                    {kind: "Button", ontap: "postViewBack", classes: "header-button left", content: $L("back")},
                    {kind: "Button", ontap: "postViewDone", classes: "header-button right", content: $L("next")}
                ]},
                {kind: "Scroller", fit: true, strategyKind: "TransitionScrollStrategy", classes: "postview-scroller", thumb: false, components: [
                    {classes: "postview-scroller-inner", components: [
                        {classes: "postview-section", components: [
                            {kind: "onyx.InputDecorator", classes: "postview-comment-input-decorator", components: [
                                {kind: "Image", classes: "postview-image-thumb", name: "image"},
                                {kind: "onyx.TextArea", name: "commentInput", onfocus: "commentFocus", onblur: "commentBlur",
                                    classes: "postview-comment-input", placeholder: $L("Ask others what they think about this product! Use #-tags like #jeans or #fancy to describe it.")}
                            ]},
                            {classes: "postview-store-like", components: [
                                {kind: "Image", classes: "postview-store-icon", src: "assets/images/black_marker.png"},
                                {name: "store", classes: "postview-store", content: "Rocket! store"},
                                {style: "width: 50px; height: 50px; background: url(assets/images/like_button.png) no-repeat 0 0; background-size: cover; position: absolute; right: 10px; top: -25px;"}
                            ]}
                        ]},
                        {kind: "Group", classes: "postview-section", components: [
                            {kind: "GroupItem", active: true, ontap: "visibilitySelected", classes: "postview-visibility-item", value: "public", components: [
                                {classes: "postview-visibility-header", components: [
                                    {classes: "postview-visibility-icon public"},
                                    {classes: "postview-visibility-title", content: $L("Public")}
                                ]},
                                {classes: "postview-visibility-description", content: $L("All your followers and friends can see this Chu.")}
                            ]},
                            {kind: "GroupItem", ontap: "visibilitySelected", classes: "postview-visibility-item", value: "private", components: [
                                {classes: "postview-visibility-header", components: [
                                    {classes: "postview-visibility-icon private"},
                                    {classes: "postview-visibility-title", content: $L("Private")}
                                ]},
                                {classes: "postview-visibility-description", content: $L("This Chu is private but you can share it with selected friends.")}
                            ]}
                        ]},
                        {classes: "postview-share-header", components: [
                            {classes: "postview-share-header-text", content: $L("Share")},
                            {classes: "postview-share-header-count", name: "shareCount"}
                        ]},
                        {kind: "Button", content: $L("Share with selected friends"), classes: "postview-add-friends", ontap: "openPeoplePicker"},
                        {classes: "postview-section", components: [
                            {kind: "Button", name: "facebookButton", ontap: "toggleFacebook", classes: "postview-share-button facebook", components: [
                                {classes: "postview-share-icon"},
                                {classes: "postview-share-caption", content: "Facebook"}
                            ]},
                            {kind: "Button", ontap: "twitter", classes: "postview-share-button twitter", components: [
                                {classes: "postview-share-icon"},
                                {classes: "postview-share-caption", content: "Twitter"}
                            ]},
                            {kind: "Button", ontap: "messaging", classes: "postview-share-button messaging", components: [
                                {classes: "postview-share-icon"},
                                {classes: "postview-share-caption", content: "Messaging"}
                            ]},
                            {kind: "Button", ontap: "email", classes: "postview-share-button email", components: [
                                {classes: "postview-share-icon"},
                                {classes: "postview-share-caption", content: "Email"}
                            ]}
                        ]}
                    ]}
                ]}
            ]},
            {kind: "PeoplePicker", onDone: "peoplePickerDone"}
        ]}
    ]
});