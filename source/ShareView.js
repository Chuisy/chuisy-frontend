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
            if (response.meta && response.meta.next) {
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
            var visibility = this.$.visibilityPicker.getActive().value;
            var text1 = $L("Your Chu is now <strong>" + visibility + "</strong>!");
            var text2 = $L("Ask your friends who are not on Chuisy what they think about this piece of fashion.");
            if (visibility == "private") {
                text2 += $L(" Only they can see it!");
            }
            var text3 = visibility == "public" ? $L("A public Chu can be seen by anyone. Be chuisy and spread prettiness!")
                : $L("Choose your best friends on Chuisy to share this Chu with.");
            this.$.text1.setContent(text1);
            this.$.text2.setContent(text2);
            this.$.panels.setIndex(visibility == "private" ? 0 : 1);
        }
    },
    getMessage: function() {
        if (this.chu.location && this.chu.location.place) {
            return $L("Check out this cool product I found at {{ place }}!").replace("{{ place }}", this.chu.location.place.name);
        } else {
            return $L("Check out this cool product!");
        }
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
        var subject = $L("Hi there!");
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

        chuisy.closet.update(this.chu);
        this.doDone();
    },
    /**
        Toggle if chu should be shared as open graph stories
    */
    toggleFacebook: function() {
        this.facebook = !this.facebook;
        this.$.facebookButton.addRemoveClass("active", this.facebook);
    },
    activate: function(obj) {
        this.setChu(obj);
        enyo.Signals.send("onShowGuide", {view: "share"});
    },
    deactivate: function() {},
    components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: $L("back")},
            {kind: "Group", name: "visibilityPicker", classes: "visibility-picker", onActivate: "visibilityChanged", components: [
                {kind: "GroupItem", classes: "private-button", name: "privateButton", ontap: "setVisibility", value: "private"},
                {kind: "GroupItem", classes: "public-button", name: "publicButton", ontap: "setVisibility", value: "public"}
            ]},
            {kind: "onyx.Button", ontap: "done", classes: "done-button", content: $L("done"), name: "doneButton"}
        ]},
        {classes: "shareview-visibility-text", name: "text1", allowHtml: true},
        {classes: "shareview-text", name: "text2"},
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
            // FRIENDS
            {kind: "FittableRows", classes: "enyo-fill", components: [
                {classes: "shareview-text", content: $L("Choose your best friends on Chuisy to share this Chu with.")},
                {kind: "PeoplePicker", name: "peoplePicker", fit: true}
            ]},
            {classes: "enyo-fill", components: [
                {classes: "shareview-text", content: $L("A public Chu can be seen by anyone. Be chuisy and spread prettiness!")},
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
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged"}
    ]
});