/**
    _ShareView_ is a view for changing the visibily settings of a chu and share it via facebook and other media
*/
enyo.kind({
    name: "ShareView",
    classes: "shareview",
    kind: "FittableRows",
    published: {
        // Chu to be shared/edited
        chu: null
    },
    twitterUrl: "http://twitter.com/share/",
    pinterestUrl: "http://pinterest.com/pin/create/button/",
    mediaUrl: "http://media.chuisy.com/media/",
    events: {
        // User has tapped the done button / Changes have been saved
        onDone: "",
        // User has tapped the back button
        onBack: ""
    },
    friends: [],
    chuChanged: function() {
        this.$[this.chu.visibility + "Button"].setActive(true);
        this.facebook = this.chu.fb_og;
        this.$.facebookButton.addRemoveClass("active", this.facebook);
        this.friends = [];
        this.loadFriends(0, 20);
        // Only allow sharing if the chu has an id yet. I.e. if it has been saved in the database.
        // Otherwise no link can be generated
        this.$.smsButton.setDisabled(this.chu.id === undefined);
        this.$.emailButton.setDisabled(this.chu.id === undefined);
        this.$.twitterButton.setDisabled(this.chu.id === undefined);
        this.$.pinterestButton.setDisabled(this.chu.id === undefined);
        this.$.peoplePicker.setSelectedItems(this.chu.friends || []);
    },
    /**
        Load the users friends and populate the people picker with the results
    */
    loadFriends: function(offset, limit) {
        chuisy.friends({offset: offset, limit: limit}, enyo.bind(this, function(sender, response) {
            this.friends = this.friends.concat(response.objects);
            this.$.peoplePicker.setItems(this.friends);
            if (response.meta.next) {
                // Recursively load pages until all friends are loaded
                this.loadFriends(response.meta.offset + limit, limit);
            }
        }));
    },
    userChanged: function(sender, event) {
        if (event.user && !this.user || event.user && this.user.id != event.user.id) {
            this.friends = [];
            this.loadFriends(0, 20);
        }
        this.user = event.user;
    },
    setVisibility: function(sender, event) {
        sender.setActive(true);
    },
    visibilityChanged: function(sender, event) {
        if (event.originator.getActive()) {
            // Visibilty has changed. Switch between people selector and share buttons
            this.$.panels.setIndex(this.$.visibilityPicker.getActive().value == "private" ? 1 : 0);
        }
    },
    getMessage: function() {
        return "Check out this cool product" + (this.chu.location && this.chu.location.place ? " I found at " + this.chu.location.place.name : "") + "!";
    },
    /**
        Get the share url for the _chu_
    */
    getShareUrl: function() {
        var url = this.chu.url;
        if (this.$.visibilityPicker.getActive().value == "private") {
            url += "?s=" + this.chu.secret;
        }
        return url;
    },
    /**
        Open twitter share dialog
    */
    twitter: function() {
        var text = this.getMessage();
        var url = this.getShareUrl();
        window.location = this.twitterUrl + "?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url) + "&via=Chuisy";
    },
    /**
        Open pinterest share dialog
    */
    pinterest: function() {
        var url = this.getShareUrl();
        var media = this.chu.image;
        window.location = this.pinterestUrl + "?url=" + encodeURIComponent(url) + "&media=" + encodeURIComponent(media);
    },
    /**
        Open sms composer with message / link
    */
    sms: function() {
        var message = this.getMessage();
        window.plugins.smsComposer.showSMSComposer(null, message + " " + this.getShareUrl());
    },
    /**
        Open email composer with message / link
    */
    email: function() {
        var subject = "Hi there!";
        var message = this.getMessage();
        window.plugins.emailComposer.showEmailComposer(subject, message + " " + this.getShareUrl());
    },
    /**
        Apply changes and fire _onDone_ event
    */
    done: function() {
        this.chu.visibility = this.$.visibilityPicker.getActive().value;
        this.chu.friends = this.$.peoplePicker.getSelectedItems();
        this.chu.fb_og = this.facebook;

        chuisy.chubox.update(this.chu);
        this.doDone();
    },
    /**
        Toggle if chu should be shared as open graph stories
    */
    toggleFacebook: function() {
        this.facebook = !this.facebook;
        this.$.facebookButton.addRemoveClass("active", this.facebook);
    },
    components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
            {kind: "Group", name: "visibilityPicker", classes: "visibility-picker", onActivate: "visibilityChanged", components: [
                {kind: "GroupItem", classes: "private-button", name: "privateButton", ontap: "setVisibility", value: "private"},
                {kind: "GroupItem", classes: "public-button", name: "publicButton", ontap: "setVisibility", value: "public"}
            ]},
            {kind: "onyx.Button", ontap: "done", classes: "done-button", content: "done", name: "doneButton"}
        ]},
        {classes: "shareview-text", content: "Sharing is caring! Want feedback from your friends? Go ahead and share!"},
        {classes: "shareview-share-button-group", components: [
            // SMS
            {kind: "Button", name: "smsButton", classes: "shareview-share-button", ontap: "sms", components: [
                {classes: "shareview-share-button-icon message"}
            ]},
            // EMAIL
            {kind: "Button", name: "emailButton", classes: "shareview-share-button", ontap: "email", components: [
                {classes: "shareview-share-button-icon mail"}
            ]}
        ]},
        {kind: "Panels", arrangerKind: "CarouselArranger", fit: true, draggable: false, layoutKind: "FittableRowsLayout", components: [
            {classes: "enyo-fill", components: [
                {classes: "shareview-text", content: "Your Chu is now public. Public Chus can be seen by everyone and you can share them on your favorite social networks!"},
                {classes: "shareview-share-button-group", components: [
                    // FACEBOOK
                    {kind: "Button", name: "facebookButton", classes: "shareview-share-button", ontap: "toggleFacebook", components: [
                        {classes: "shareview-share-button-icon facebook"}
                    ]},
                    // TWITTER
                    {kind: "Button", name: "twitterButton", classes: "shareview-share-button", ontap: "twitter", components: [
                        {classes: "shareview-share-button-icon twitter"}
                    ]},
                    // PINTEREST
                    {kind: "Button", name: "pinterestButton", classes: "shareview-share-button", ontap: "pinterest", components: [
                        {classes: "shareview-share-button-icon pinterest"}
                    ]}
                ]}
            ]},
            // FRIENDS
            {kind: "FittableRows", classes: "enyo-fill", components: [
                {classes: "shareview-text", content: "Your Chu is now private. By default private Chus can't be seen by anyone, but you can still share it with some special people!"},
                {kind: "PeoplePicker", name: "peoplePicker", fit: true}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged"}
    ]
});