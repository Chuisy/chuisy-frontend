enyo.kind({
    name: "ComposeChu",
    kind: "FittableRows",
    classes: "composechu",
    published: {
        user: null
    },
    events: {
        onBack: ""
    },
    userChanged: function(sender, event) {
        if (!this.user || this.user.id != event.user.id) {
            this.user = event.user;
            this.loadFriends();
            this.$.chubox.setUser(this.user);
        }
    },
    initialize: function() {
        this.$.title.setValue("");
        this.visibility = "public";
        this.selectedItems = {};
        this.location = null;

        navigator.geolocation.getCurrentPosition(enyo.bind(this, function(position) {
            this.location = {latitude: position.coords.latitude, longitude: position.coords.longitude};
        }), enyo.bind(this, function() {
            this.error("Failed to retrieve geolocation!");
            alert("Failed to get location!");
        }));

        this.$[this.visibility + "Button"].setActive(true);
        this.$.friendsSelector.setSelectedItems([]);
        this.$.chubox.refreshItems();
    },
    toUriList: function(list) {
        var temp = [];
        for (var i=0; i<list.length; i++) {
            temp.push(list[i].resource_uri);
        }
        return temp;
    },
    toParamsObj: function(obj) {
        var params = enyo.clone(obj);

        // Have to do this because of bug in django-tastypie 0.9.11
        params.items = this.toUriList(params.items);
        params.friends = this.toUriList(params.friends);

        return params;
    },
    openSecondarySlider: function() {
        this.$.secondarySlider.animateToMin();
    },
    closeSecondarySlider: function() {
        this.$.secondarySlider.animateToMax();
    },
    visibiltySelected: function(sender, event) {
        var value = sender.value;

        this.visibility = value;

        if (value == "friends") {
            this.openSecondarySlider();
        } else {
            this.closeSecondarySlider();
        }
    },
    loadFriends: function() {
        chuisy.friends({}, enyo.bind(this, function(sender, response) {
            this.$.friendsSelector.setItems(response.objects);
        }));
    },
    itemTap: function(sender, event) {
        // var item = this.items[event.index];
    },
    back: function() {
        if (this.$.secondarySlider.getValue() == this.$.secondarySlider.getMin()) {
            this.closeSecondarySlider();
        } else {
            this.doBack();
        }
    },
    isSelected: function(item) {
        return this.selectedItems.hasOwnProperty(item.id);
    },
    selectItem: function(item) {
        this.selectedItems[item.id] = item;
    },
    deselectItem: function(item) {
        delete this.selectedItems[item.id];
    },
    toggleSelected: function(item) {
        if (!this.isSelected(item)) {
            this.selectItem(item);
        } else {
            this.deselectItem(item);
        }
    },
    itemSelected: function(sender, event) {
        this.toggleSelected(event.item);
        event.originator.addRemoveClass("selected", this.isSelected(event.item));
    },
    getSelectedItems: function() {
        var items = [];
        for (var x in this.selectedItems) {
            items.push(this.selectedItems[x]);
        }
        return items;
    },
    postChu: function() {
        var data = {
            title: this.$.title.getValue(),
            visibility: this.visibility,
            items: this.toUriList(this.getSelectedItems()),
            friends: this.toUriList(this.$.friendsSelector.getSelectedItems()),
            location: this.location,
            comments: [],
            share_facebook: this.facebook,
            share_twitter: this.twitter,
            share_pinterest: this.pinterest
        };

        chuisy.chu.create(data, enyo.bind(this, function(sender, response) {
            this.log(response);
            this.doBack();
        }));
    },
    togglePlatform: function(sender, event) {
        var p = sender.platform;
        this[p] = !this[p];
        this.$[p + "Button"].addRemoveClass("active", this[p]);
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "back", classes: "back-button", content: "back"},
            {classes: "mainheader-text", content: "chuisy"}
        ]},
        {style: "position: relative;", fit: true, components: [
            {kind: "FittableRows", classes: "enyo-fill", components: [
                // TITLE
                {kind: "onyx.InputDecorator", style: "width: 100%; box-sizing: border-box;", alwaysLooksFocused: true, components: [
                    {kind: "onyx.TextArea", style: "width: 100%;", name: "title", placeholder: "Type title here...", onchange: "titleChanged"}
                ]},
                {kind: "Chubox", fit: true, onItemSelected: "itemSelected"},
                {components: [
                    // VISIBILITY
                    {kind: "Group", classes: "composechu-visibility-selector", components: [
                        {kind: "Button", name: "publicButton", classes: "pageheader-radiobutton", content: "public", value: "public", ontap: "visibiltySelected"},
                        {classes: "enyo-inline", allowHtml: true, content: "&#183;"},
                        {kind: "Button", name: "privateButton", classes: "pageheader-radiobutton", content: "friends", value: "friends", ontap: "visibiltySelected"}
                    ]},
                    {kind: "onyx.Button", name: "facebookButton", content: "f", platform: "facebook", ontap: "togglePlatform"},
                    {kind: "onyx.Button", name: "twitterButton", content: "t", platform: "twitter", ontap: "togglePlatform"},
                    {kind: "onyx.Button", name: "pinterestButton", content: "p", platform: "pinterest", ontap: "togglePlatform"},
                    // POST
                    {kind: "onyx.Button", name: "postButton", classes: "composechu-post-button onyx-affirmative", content: "Post Chu", ontap: "postChu"}
                ]}
            ]},
            {kind: "Slideable", overMoving: false, unit: "px", min: -330, max: 0, preventDragPropagation: true, classes: "secondaryslider", name: "secondarySlider", components: [
                {classes: "enyo-fill", components: [
                    {kind: "PeopleSelector", name: "friendsSelector", onChange: "friendsChanged"}
                ]}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged"}
    ]
});