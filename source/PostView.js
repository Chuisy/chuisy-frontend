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
        shareFacebook: false,
        like: false,
        uuid: ""
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        this.shareFacebookChanged();
        this.activeUserChanged();
        chuisy.accounts.on("change:active_user", this.activeUserChanged, this);
    },
    storeChanged: function() {
        this.$.store.setContent(this.store ? this.store.get("name") : "");
    },
    imageChanged: function() {
        this.$.image.setSrc(this.image);
    },
    visibilityChanged: function() {
        this.$[this.visibility + "Button"].setActive(true);
        this.$.shareButtons.setShowing(this.visibility == "public");
        this.setShareFacebook(this.visibility == "private" ? false : this.shareFacebook);
    },
    visibilitySelected: function(sender, event) {
        this.setVisibility(sender.value);
    },
    shareFacebookChanged: function() {
        this.$.facebookButton.addRemoveClass("active", this.shareFacebook);
        if (this.shareFacebook) {
            App.fbRequestPublishPermissions(null, enyo.bind(this, function() {
                this.setShareFacebook(false);
            }));
        }
    },
    likeChanged: function() {
        this.$.likeButton.setActive(this.like);
    },
    toggleFacebook: function() {
        // this.$.facebookButton.setActive(!this.$.facebookButton.getActive());
        this.setShareFacebook(!this.shareFacebook);
    },
    toggleLike: function() {
        this.setLike(!this.like);
        return true;
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
            // Fetch the active users friends
            user.friends.fetchAll({success: enyo.bind(this, function() {
                this.$.peoplePicker.setItems(user.friends.models);
            })});
        }
    },
    getFriends: function() {
        return this.$.peoplePicker.getSelectedItems();
    },
    clear: function() {
        // this.setVisibility("public");
        this.setImage("");
        this.visibilityChanged();
        this.$.peoplePicker.setSelectedItems([]);
        this.$.shareCount.setContent("");
        this.setupFriends();
        this.setStore(null);
        this.setShareFacebook(false);
        this.$.commentInput.setValue("");
        this.setLike(false);
        this.setUuid("");
        App.fbHasPublishPermissions(enyo.bind(this, function(yes) {
            this.setShareFacebook(yes && this.visibility == "public");
        }));
    },
    getComment: function() {
        return this.$.commentInput.getValue();
    },
    activeUserChanged: function() {
        var user = chuisy.accounts.getActiveUser();
        this.setVisibility(user ? "public" : "private");
        this.$.publicButton.setDisabled(!user);
        this.$.share.setShowing(user);
        this.$.login.setShowing(!user);
    },
    getShareMessage: function() {
        if (this.store && this.store.get("name")) {
            return $L("Look what I found at {{ place }}! What do you think?").replace("{{ place }}", this.store.get("name"));
        } else {
            return $L("Check out this cool fashion item!");
        }
    },
    getShareUrl: function() {
        return "http://www.chuisy.com/chu/uuid/" + this.uuid + "/";
    },
    twitter: function() {
        App.shareTwitter(this.getShareMessage(), this.getShareUrl(), this.image);
    },
    messaging: function() {
        App.shareMessaging(this.getShareMessage(), this.getShareUrl());
    },
    email: function() {
        App.shareEmail(this.getShareMessage(), this.getShareUrl());
    },
    components: [
        {kind: "AnimatedPanels", name: "panels", classes: "enyo-fill", components: [
            {name: "formView", components: [
                {classes: "header", components: [
                    {classes: "header-icon back", ontap: "doBack"},
                    {kind: "Button", ontap: "doDone", classes: "header-button right primary", content: $L("post")}
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
                            {kind: "LikeButton", classes: "postview-like-button", ontap: "toggleLike"}
                        ]}
                    ]},
                    {kind: "Group", classes: "postview-section", components: [
                        {kind: "Button", name: "publicButton", active: true, ontap: "visibilitySelected", classes: "postview-visibility-item", value: "public", components: [
                            {classes: "postview-visibility-header", components: [
                                {classes: "postview-visibility-icon public"},
                                {classes: "postview-visibility-title", content: $L("Public")}
                            ]},
                            {classes: "postview-visibility-description", content: $L("All your followers and friends can see this Chu.")}
                        ]},
                        {kind: "Button", name: "privateButton", ontap: "visibilitySelected", classes: "postview-visibility-item", value: "private", components: [
                            {classes: "postview-visibility-header", components: [
                                {classes: "postview-visibility-icon private"},
                                {classes: "postview-visibility-title", content: $L("Private")}
                            ]},
                            {classes: "postview-visibility-description", content: $L("This Chu is private but you can share it with selected friends.")}
                        ]}
                    ]},
                    {name: "share", components: [
                        {classes: "postview-share-header", components: [
                            {classes: "postview-share-header-text", content: $L("Share")},
                            {classes: "postview-share-header-count", name: "shareCount"}
                        ]},
                        {kind: "Button", content: $L("Share with selected friends"), classes: "postview-section postview-add-friends", ontap: "openPeoplePicker"},
                        {name: "shareButtons", classes: "postview-section", components: [
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
                    ]},
                    {name: "login", classes: "postview-login-container", components: [
                        {classes: "postview-login-text", content: $L("If you want to share this Chu with others you have to login first. Don't worry, your data is safe and we won't post anything without asking you!")},
                        {kind: "SignInButton"}
                    ]}
                ]}
            ]},
            {kind: "PeoplePicker", onDone: "peoplePickerDone", style: "z-index: 100"}
        ]}
    ]
});