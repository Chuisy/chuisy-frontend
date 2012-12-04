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
        onDone: ""
    },
    friends: [],
    chuChanged: function() {
        this.log(this.chu);
        this.$.visibilityPicker.setValue(this.chu.visibility == "private" ? true : false);
        this.visibilityChanged();
        this.$.peoplePicker.setSelectedItems(this.chu.friends);
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
        if (!this.user || this.user.id != event.user.id) {
            this.friends = [];
            this.loadFriends(0, 20);
        }
        this.user = event.user;
    },
    visibilityChanged: function(sender, event) {
        this.$.panels.setIndex(this.$.visibilityPicker.getValue() ? 1 : 0);
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
        this.chu.visibility = this.$.visibilityPicker.getValue() ? "private" : "public";
        var friends = this.$.peoplePicker.getSelectedItems();
        var friendUris = [];
        for (var i=0; i<friends.length; i++) {
            friendUris.push(friends[i].resource_uri);
        }

        params = enyo.clone(this.chu);
        this.chu.friends = friends;
        params.friends = friendUris;
        delete params.user;
        params.image = params.image.replace(/http:\/\/media.chuisy.com\/media\//, "");
        // params.location = params.location.resource_uri;
        // params.product = params.product.resource_uri;
        // delete params.resource_uri;

        this.log(params);

        chuisy.chu.put(params.id, params, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
        this.doDone();
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.ToggleButton", onContent: "private", offContent: "public", name: "visibilityPicker", classes: "chuform-visibility-picker", onChange: "visibilityChanged"},
            {kind: "onyx.Button", ontap: "done", classes: "done-button", content: "done", name: "doneButton"}
        ]},
        {classes: "shareview-text", content: "Sharing is caring!"},
        {classes: "shareview-share-button-group", components: [
            {classes: "shareview-share-button", content: "sms", ontap: "sms"},
            {classes: "shareview-share-button", content: "email", ontap: "email"}
        ]},
        {kind: "Panels", arrangerKind: "CarouselArranger", fit: true, draggable: false, layoutKind: "FittableRowsLayout", components: [
            {classes: "shareview-share-button-group enyo-fill", components: [
                {classes: "shareview-share-button", content: "f"},
                {classes: "shareview-share-button", content: "t", ontap: "twitter"},
                {classes: "shareview-share-button", content: "p", ontap: "pinterest"}
            ]},
            {kind: "PeoplePicker", classes: "enyo-fill"}
        ]},
        {kind: "Signals", onUserChanged: "userChanged"}
    ]
});