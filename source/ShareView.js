enyo.kind({
    name: "ShareView",
    classes: "shareview",
    kind: "FittableRows",
    published: {
        chu: null
    },
    twitterUrl: "http://twitter.com/share/",
    pinterestUrl: "http://pinterest.com/pin/create/button/",
    mediaUrl: "http://media.chuisy.com/media/",
    events: {
        onDone: "",
        onBack: ""
    },
    friends: [],
    chuChanged: function() {
        this.$[this.chu.visibility + "Button"].setActive(true);
        this.facebook = this.chu.share_facebook;
        this.friends = [];
        this.loadFriends(0, 20);
        this.$.smsButton.setDisabled(this.chu.id === undefined);
        this.$.emailButton.setDisabled(this.chu.id === undefined);
        this.$.twitterButton.setDisabled(this.chu.id === undefined);
        this.$.pinterestButton.setDisabled(this.chu.id === undefined);
        this.$.peoplePicker.setSelectedItems(this.chu.friends || []);
    },
    loadFriends: function(offset, limit) {
        chuisy.friends({offset: offset, limit: limit}, enyo.bind(this, function(sender, response) {
            this.friends = this.friends.concat(response.objects);
            this.$.peoplePicker.setItems(this.friends);
            if (response.meta.next) {
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
            this.$.panels.setIndex(this.$.visibilityPicker.getActive().value == "private" ? 1 : 0);
        }
    },
    getMessage: function() {
        return "Check out this cool product" + (this.chu.location && this.chu.location.place ? " I found at " + this.chu.location.place.name : "") + "!";
    },
    twitter: function() {
        var text = this.getMessage();
        var url = this.chu.share_url;
        window.location = this.twitterUrl + "?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url) + "&via=Chuisy";
    },
    pinterest: function() {
        var url = this.chu.share_url;
        var media = this.chu.image;
        window.location = this.pinterestUrl + "?url=" + encodeURIComponent(url) + "&media=" + encodeURIComponent(media);
    },
    sms: function() {
        var message = this.getMessage();
        window.plugins.smsComposer.showSMSComposer(null, message + " " + this.chu.share_url);
    },
    email: function() {
        var subject = "Hi there!";
        var message = this.getMessage();
        window.plugins.emailComposer.showEmailComposer(subject, message + " " + this.chu.share_url);
    },
    done: function() {
        this.chu.visibility = this.$.visibilityPicker.getActive().value;
        this.chu.friends = this.$.peoplePicker.getSelectedItems();
        this.chu.share_facebook = this.facebook;

        chuisy.chubox.update(this.chu);
        this.doDone();
    },
    back: function() {
        this.doDone();
    },
    toggleFacebook: function() {
        this.facebook = !this.facebook;
        this.$.facebookButton.addRemoveClass("active", this.facebook);
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "back", classes: "back-button", content: "back"},
            {kind: "Group", name: "visibilityPicker", classes: "visibility-picker", onActivate: "visibilityChanged", components: [
                {kind: "GroupItem", classes: "private-button", name: "privateButton", ontap: "setVisibility", value: "private"},
                {kind: "GroupItem", classes: "public-button", name: "publicButton", ontap: "setVisibility", value: "public"}
            ]},
            {kind: "onyx.Button", ontap: "done", classes: "done-button", content: "done", name: "doneButton"}
        ]},
        {classes: "shareview-text", content: "Sharing is caring! Want feedback from your friends? Go ahead and share!"},
        {classes: "shareview-share-button-group", components: [
            {kind: "Button", name: "smsButton", classes: "shareview-share-button", ontap: "sms", components: [
                {classes: "shareview-share-button-icon message"}
            ]},
            {kind: "Button", name: "emailButton", classes: "shareview-share-button", ontap: "email", components: [
                {classes: "shareview-share-button-icon mail"}
            ]}
        ]},
        {kind: "Panels", arrangerKind: "CarouselArranger", fit: true, draggable: false, layoutKind: "FittableRowsLayout", components: [
            {classes: "enyo-fill", components: [
                {classes: "shareview-text", content: "Your Chu is now public. Public Chus can be seen by everyone and you can share them on your favorite social networks!"},
                {classes: "shareview-share-button-group", components: [
                    {kind: "Button", name: "facebookButton", classes: "shareview-share-button", ontap: "toggleFacebook", components: [
                        {classes: "shareview-share-button-icon facebook"}
                    ]},
                    {kind: "Button", name: "twitterButton", classes: "shareview-share-button", ontap: "twitter", components: [
                        {classes: "shareview-share-button-icon twitter"}
                    ]},
                    {kind: "Button", name: "pinterestButton", classes: "shareview-share-button", ontap: "pinterest", components: [
                        {classes: "shareview-share-button-icon pinterest"}
                    ]}
                ]}
            ]},
            {kind: "FittableRows", classes: "enyo-fill", components: [
                {classes: "shareview-text", content: "Your Chu is now private. By default private Chus can't be seen by anyone, but you can still share it with some special people!"},
                {kind: "PeoplePicker", name: "peoplePicker", fit: true}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged"}
    ]
});