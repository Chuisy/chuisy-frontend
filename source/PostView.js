enyo.kind({
    name: "PostView",
    classes: "postview",
    events: {
        onBack: "",
        onDone: ""
    },
    published: {
        store: null,
        image: "",
        visibility: "public",
        shareFacebook: false
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        this.setupFriends();
        this.shareFacebookChanged();
        this.visibilityChanged();
    },
    storeChanged: function() {
        this.$.store.setContent(this.store.get("name"));
    },
    imageChanged: function() {
        this.$.image.setSrc(this.image);
    },
    visibilityChanged: function() {
        this.$[this.visibility + "Button"].setActive(true);
    },
    visibilitySelected: function(sender, event) {
        sender.setActive(true);
        this.visibility = sender.value;
    },
    shareFacebookChanged: function() {
        this.$.facebookButton.addRemoveClass("active", this.shareFacebook);
        if (this.shareFacebook) {
            App.fbRequestPublishPermissions(null, enyo.bind(this, function() {
                this.setShareFacebook(false);
            }));
        }
    },
    toggleFacebook: function() {
        // this.$.facebookButton.setActive(!this.$.facebookButton.getActive());
        this.setShareFacebook(!this.shareFacebook);
    },
    openPeoplePicker: function() {
        this.$.panels.select(this.$.peoplePicker, AnimatedPanels.SLIDE_IN_FROM_BOTTOM, AnimatedPanels.NONE);
        this.$.peoplePicker.resized();
        event.preventDefault();
        return true;
    },
    peoplePickerDone: function() {
        this.$.panels.select(this.$.formView, AnimatedPanels.NONE, AnimatedPanels.SLIDE_OUT_TO_BOTTOM);
        this.$.shareCount.setContent(this.$.peoplePicker.getSelectedItems().length || "");
        event.preventDefault();
        return true;
    },
    setupFriends: function() {
        var user = chuisy.accounts.getActiveUser();
        if (user) {
            this.$.peoplePicker.setItems(user.friends.models);
        }
    },
    getFriends: function() {
        return this.$.peoplePicker.getSelectedItems();
    },
    clear: function() {
        this.setVisibility("public");
        this.$.peoplePicker.setSelectedItems([]);
        this.$.shareCount.setContent("");
        this.setupFriends();
        this.setStore(null);
        this.setShareFacebook(false);
        App.fbHasPublishPermissions(enyo.bind(this, function(yes) {
            this.setShareFacebook(yes);
        }));
    },
    components: [
        {kind: "AnimatedPanels", name: "panels", classes: "enyo-fill", components: [
            {name: "formView", components: [
                {classes: "header", components: [
                    {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")},
                    {kind: "Button", ontap: "doDone", classes: "header-button right", content: $L("next")}
                ]},
                {classes: "postview-scroller-inner", components: [
                    {classes: "postview-section", components: [
                        {kind: "onyx.InputDecorator", classes: "postview-comment-input-decorator", components: [
                            {kind: "Image", classes: "postview-image-thumb", name: "image"},
                            {kind: "onyx.TextArea", name: "commentInput", onfocus: "commentFocus", onblur: "commentBlur",
                                classes: "postview-comment-input", placeholder: $L("Ask others what they think about this product! Use #-tags like #jeans or #fancy to describe it.")}
                        ]},
                        {classes: "postview-store-like", components: [
                            {kind: "Image", classes: "postview-store-icon", src: "assets/images/black_marker.png"},
                            {name: "store", classes: "postview-store ellipsis"},
                            {style: "width: 50px; height: 50px; background: url(assets/images/like_button.png) no-repeat 0 0; background-size: cover; position: absolute; right: 10px; top: -25px;"}
                        ]}
                    ]},
                    {kind: "Group", classes: "postview-section", components: [
                        {kind: "GroupItem", name: "publicButton", active: true, ontap: "visibilitySelected", classes: "postview-visibility-item", value: "public", components: [
                            {classes: "postview-visibility-header", components: [
                                {classes: "postview-visibility-icon public"},
                                {classes: "postview-visibility-title", content: $L("Public")}
                            ]},
                            {classes: "postview-visibility-description", content: $L("All your followers and friends can see this Chu.")}
                        ]},
                        {kind: "GroupItem", name: "privateButton", ontap: "visibilitySelected", classes: "postview-visibility-item", value: "private", components: [
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
            ]},
            {kind: "PeoplePicker", onDone: "peoplePickerDone", style: "z-index: 100"}
        ]}
    ]
});