enyo.kind({
    name: "ChuView",
    classes: "chuview",
    published: {
        user: null,
        chu: null
    },
    events: {
        onBack: "",
        onItemSelected: ""
    },
    userChanged: function() {
        this.loadChuboxItems();
        this.applyPermissions();
    },
    chuChanged: function() {
        if (this.chu) {
            this.$.title.setValue(this.chu.title);
            this.visibility = this.chu.visibility;
            this.items = this.chu.items;
            this.visibleTo = this.chu.visible_to;
            this.taggedPersons = this.chu.tagged;
            this.location = this.chu.location;
        } else {
            this.$.title.setValue("");
            this.visibility = "public";
            this.items = [];
            this.visibleTo = [];
            this.taggedPersons = [];
            this.location = null;
        }
        this.$.postButton.setShowing(!this.chu);
        this.$[this.visibility + "Button"].setActive(true);
        this.applyPermissions();
        this.refreshChuItems();
        this.refreshTaggedPersons();
        this.$.visibilityPeopleSelector.setSelectedItems(this.visibleTo);
        this.$.taggedPeopleSelector.setSelectedItems(this.taggedPersons);
        this.$.locationPicker.setLocation(this.location);
        this.updateLocationText();
        this.refreshComments();
        this.$.commentsButton.setShowing((this.chu));
    },
    isOwned: function() {
        return !this.chu || this.user && this.chu.user.id == this.user.profile.id;
    },
    applyPermissions: function() {
        var owned = this.isOwned();
        this.addRemoveClass("owned", owned);
        this.$.title.setDisabled(!owned);
        this.$.publicButton.setDisabled(!owned);
        this.$.privateButton.setDisabled(!owned);
        this.$.customButton.setDisabled(!owned);
        this.$.locationButton.setDisabled(!owned);
        this.$.tagButton.setDisabled(!owned);
    },
    clear: function() {
        this.chu = null;
        this.chuChanged();
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
        params.tagged = this.toUriList(params.tagged);
        params.visible_to = this.toUriList(params.visible_to);
        params.expandable_by = this.toUriList(params.expandable_by);

        return params;
    },
    updateChu: function(callback) {
        chuisy.chu.put(this.chu.id, this.toParamsObj(this.chu), enyo.bind(this, function(sender, response) {
            if (callback) {
                callback();
            }
        }));
    },
    titleChanged: function() {
        if (this.chu) {
            this.chu.title = this.$.title.getValue();
            this.updateChu();
        }
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

        if (this.chu) {
            this.chu.visibility = value;
            this.updateChu();
        }

        if (value == "custom") {
            this.$.secondaryPanels.setIndex(1);
            this.openSecondarySlider();
        } else {
            this.$.secondaryPanels.setIndex(0);
            this.closeSecondarySlider();
        }
    },
    confirmVisibilityPeople: function() {
        var people = this.$.visibilityPeopleSelector.getSelectedItems();

        this.visibleTo = people;

        if (this.chu) {
            this.chu.visible_to =  this.visibleTo;
            this.updateChu();
        }

        this.$.secondaryPanels.setIndex(0);
        this.closeSecondarySlider();
    },
    refreshTaggedPersons: function() {
        this.$.taggedRepeater.setCount(this.taggedPersons.length);
        this.$.taggedRepeater.render();
    },
    refreshChuItems: function() {
        this.$.itemRepeater.setCount(this.items.length + 1);
        this.$.itemRepeater.render();
    },
    setupTaggedPerson: function(sender, event) {
        var user = this.taggedPersons[event.index];
        event.item.$.thumbnail.setSrc(user.profile.avatar);
    },
    setupRepeaterItem: function(sender, event) {
        if (event.index < this.items.length) {
            var item = this.items[event.index];
            event.item.$.chuboxItem.setItem(item);
            event.item.$.chuboxItem.show();
            event.item.$.chuboxItem.setUser(this.user);
            event.item.$.chuboxItem.setChu(this.chu);
            event.item.$.newItemButton.hide();
        } else {
            event.item.$.chuboxItem.hide();
            event.item.$.newItemButton.show();
        }
        // var rot = Math.random() * 20 - 10; // Rotate by a random angle between -10 and 10 deg
        // c.applyStyle("transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-webkit-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-ms-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-moz-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-o-transform", "rotate(" + rot + "deg)");
    },
    loadChuboxItems: function() {
        if (this.user) {
            chuisy.chuboxitem.list([["user", this.user.id]], enyo.bind(this, function(sender, response) {
                this.chuboxItems = response.objects;
                this.refreshChuboxItems();
            }));
        }
    },
    refreshChuboxItems: function() {
        this.$.chuboxList.setCount(this.chuboxItems.length);
        this.$.chuboxList.render();
    },
    setupChuboxItem: function(sender, event) {
        var item = this.chuboxItems[event.index];
        this.$.listChuboxItem.setItem(item);
    },
    tagPerson: function() {
        if (this.isOwned()) {
            this.$.secondaryPanels.setIndex(2);
            this.openSecondarySlider();
        }
    },
    confirmTaggedPeople: function() {
        this.taggedPersons = this.$.taggedPeopleSelector.getSelectedItems();

        if (this.chu) {
            this.chu.tagged = this.taggedPersons;
            this.updateChu();
        }

        this.refreshTaggedPersons();
        this.$.secondaryPanels.setIndex(0);
        this.closeSecondarySlider();
    },
    addItem: function() {
        this.$.secondaryPanels.setIndex(3);
        this.openSecondarySlider();
    },
    itemSelected: function(sender, event) {
        var item = this.chuboxItems[event.index];
        this.items.push(item);

        if (this.chu) {
            this.chu.items = this.items;
            this.updateChu();
        }

        this.refreshChuItems();
        this.$.secondaryPanels.setIndex(0);
        this.closeSecondarySlider();
    },
    postChu: function() {
        var data = {
            title: this.$.title.getValue(),
            visibility: this.visibility,
            expandability: "public", // TODO: Add option to change this
            user: this.user,
            items: this.toUriList(this.items),
            tagged: this.toUriList(this.taggedPersons),
            visible_to: this.toUriList(this.visibleTo),
            expandable_by: this.toUriList([]),
            location: this.location,
            comments: []
        };

        chuisy.chu.create(data, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
    },
    itemTap: function(sender, event) {
        var item = this.items[event.index];
        this.doItemSelected({item: item, chu: this.chu});
    },
    itemRemove: function(sender, event) {
        this.items.remove(event.index);

        if (this.chu) {
            this.chu.item = this.items;
            this.updateChu();
        }

        this.refreshChuItems();
    },
    closeChu: function() {
        this.chu.closed = true;
        this.updateChu(enyo.bind(this, function() {
            this.doBack();
        }));
    },
    changeLocation: function() {
        this.$.secondaryPanels.setIndex(4);
        this.$.locationPicker.initialize();
        this.openSecondarySlider();
    },
    locationChanged: function(sender, event) {
        this.log(event.location);
    },
    locationPickerBack: function() {
        this.$.secondaryPanels.setIndex(0);
        this.closeSecondarySlider();
    },
    locationPickerChanged: function() {
        this.location = this.$.locationPicker.getLocation();
        this.updateLocationText();
        if (this.chu) {
            this.chu.location = this.location;
            this.updateChu();
        }
    },
    updateLocationText: function() {
        this.$.locationText.setContent(this.location ? this.location.address : "Tap to enter location...");
    },
    refreshComments: function() {
        this.$.commentsRepeater.setCount(this.chu ? this.chu.comments.length : 0);
        this.$.commentsRepeater.render();
    },
    setupComment: function(sender, event) {
        var comment = this.chu.comments[event.index];
        this.$.commentText.setContent(comment.text);
        this.$.commentAvatar.setSrc(comment.user.profile.avatar);
    },
    commentInputKeydown: function(sender, event) {
        if (event.keyCode == 13) {
            this.commentEnter();
        }
    },
    commentEnter: function() {
        var comment = {
            text: this.$.commentInput.getValue(),
            chu: this.chu.resource_uri,
            user: this.user
        };
        this.chu.comments.push(comment);
        this.updateChu();
        this.refreshComments();
        this.$.commentInput.setValue("");
    },
    toggleComments: function() {
        this.$.secondaryPanels.setIndex(0);
        this.$.secondarySlider.toggleMinMax();
    },
    locationPickerDrag: function() {
        // Prevent drag event to propagate to slider
        return true;
    },
    components: [
        {kind: "Scroller", classes: "enyo-fill", components: [
            {classes: "main-content", components: [
                {classes: "pageheader", components: [
                    // TITLE
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", name: "title", placeholder: "Type title here...", onchange: "titleChanged"}
                    ]},
                    // VISIBILITY
                    {kind: "Group", classes: "pageheader-radiobuttongroup", components: [
                        {kind: "Button", name: "publicButton", classes: "pageheader-radiobutton", content: "public", value: "public", ontap: "visibiltySelected"},
                        {classes: "enyo-inline", allowHtml: true, content: "&#183;"},
                        {kind: "Button", name: "privateButton", classes: "pageheader-radiobutton", content: "friends", value: "private", ontap: "visibiltySelected"},
                        {classes: "enyo-inline", allowHtml: true, content: "&#183;"},
                        {kind: "Button", name: "customButton", classes: "pageheader-radiobutton", content: "select", value: "custom", ontap: "visibiltySelected"}
                    ]}
                ]},
                {style: "text-align: left", components: [
                    // TAGGED
                    {kind: "Repeater", name: "taggedRepeater", classes: "chuview-taggedrepeater", onSetupItem: "setupTaggedPerson", components: [
                        {kind: "Image", name: "thumbnail", classes: "chuview-taggedrepeater-thumbnail", ontap: "tagPerson"}
                    ]},
                    {kind: "onyx.IconButton", name: "tagButton", src: "assets/images/plus.png", ontap: "tagPerson", classes: "chuview-tagbutton"},
                    // LOCATION
                    {kind: "onyx.Button", classes: "chuview-location", name: "locationButton", ontap: "changeLocation", components: [
                        {classes: "chuview-location-text", name: "locationText"},
                        {kind: "Image", src: "assets/images/map-marker.png", classes: "chuview-location-icon"}
                    ]}
                ]},
                // ITEMS
                {style: "text-align: center;", components: [
                    {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                        {kind: "ChuboxItem", likeable: true, ontap: "itemTap", onRemove: "itemRemove"},
                        {kind: "onyx.Button", content: "Add Item", name: "newItemButton", classes: "chuview-new-item", ontap: "addItem"}
                    ]}
                ]},
                // POST
                {kind: "onyx.Button", name: "postButton", classes: "chuview-post-button onyx-affirmative", content: "Post Chu", ontap: "postChu"}
            ]}
        ]},
        {kind: "Slideable", overMoving: false, unit: "px", min: -300, max: 0, preventDragPropagation: true, classes: "secondarypanels shadow-left", name: "secondarySlider", components: [
            {kind: "Panels", name: "secondaryPanels", arrangerKind: "CardArranger", draggable: false, classes: "enyo-fill", components: [
                {classes: "enyo-fill", components: [
                    // CLOSE
                    {kind: "onyx.Button", name: "closeButton", classes: "chuview-close-button onyx-negative", content: "Close Chu", ontap: "closeChu"},
                    // COMMENTS
                    {kind: "Scroller", classes: "chuview-comments-scroller", components: [
                        {kind: "FlyweightRepeater", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                            {kind: "onyx.Item", classes: "chuview-comment", components: [
                                {kind: "Image", name: "commentAvatar", classes: "chuview-comment-avatar"},
                                {name: "commentText", classes: "chuview-comment-text"}
                            ]}
                        ]}
                    ]},
                    // POST COMMENT
                    {kind: "onyx.InputDecorator", classes: "chuview-commentinput-decorator", components: [
                        {kind: "onyx.TextArea", name: "commentInput", placeholder: "Enter comment...", onkeydown: "commentInputKeydown"}
                    ]}
                ]},
                // SELECT VISIBLE TO
                {classes: "enyo-fill", components: [
                    {content: "Visible To"},
                    {kind: "PeopleSelector", name: "visibilityPeopleSelector"},
                    {kind: "onyx.Button", content: "OK", ontap: "confirmVisibilityPeople"}
                ]},
                // SELECT TAGGED
                {classes: "enyo-fill", components: [
                    {content: "Tagged People"},
                    {kind: "PeopleSelector", name: "taggedPeopleSelector"},
                    {kind: "onyx.Button", content: "OK", ontap: "confirmTaggedPeople"}
                ]},
                // SELECT ITEM
                {classes: "enyo-fill", components: [
                    {kind: "Scroller", classes: "enyo-fill", components: [
                    {content: "Choose an Item!"},
                        {kind: "FlyweightRepeater", name: "chuboxList", classes: "enyo-fill", onSetupItem: "setupChuboxItem", components: [
                            {kind: "ListChuboxItem", ontap: "itemSelected"}
                        ]}
                    ]}
                ]},
                // PICK LOCATION
                {classes: "enyo-fill", components: [
                    {kind: "LocationPicker", classes: "enyo-fill", onLocationChanged: "locationPickerChanged", ondrag: "locationPickerDrag"},
                    {kind: "onyx.Button", classes: "chuview-map-back-button", content: "Back", ontap: "locationPickerBack"}
                ]}
            ]},
            {kind: "onyx.IconButton", src: "assets/images/speachbubble.png", classes: "slider-flap", ontap: "toggleComments", name: "commentsButton"}
        ]}
    ]
});