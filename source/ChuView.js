enyo.kind({
    name: "ChuView",
    classes: "chuview",
    kind: "FittableColumns",
    published: {
        user: null,
        chu: null
    },
    events: {
        onBack: ""
    },
    create: function() {
        this.inherited(arguments);
    },
    userChanged: function() {
        this.loadChuboxItems();
        this.addRemoveClass("owned", this.user && this.chu && this.chu.user.id == this.user.profile.id);
    },
    chuChanged: function() {
        if (this.chu) {
            this.$.title.setValue(this.chu.title);
            this.visibility = this.chu.visibility;
            this.items = this.chu.items;
            this.visibleTo = this.chu.visible_to;
            this.taggedPersons = this.chu.tagged;
        } else {
            this.$.title.setValue("");
            this.visibility = "public";
            this.items = [];
            this.visibleTo = [];
            this.taggedPersons = [];
        }
        this.$.postButton.setShowing(!this.chu);
        this.$[this.visibility + "Button"].setActive(true);
        this.addRemoveClass("owned", this.user && this.chu && this.chu.user.id == this.user.profile.id);
        this.refreshChuItems();
        this.refreshTaggedPersons();
        this.$.visibilityPeopleSelector.setSelectedItems(this.visibleTo);
        this.$.taggedPeopleSelector.setSelectedItems(this.taggedPersons);
    },
    clear: function() {
        this.chu = null;
        this.chuChanged();
    },
    updateChu: function(callback) {
        this.log(this.chu);
        chuisy.chu.put(this.chu.id, this.chu, enyo.bind(this, function(sender, response) {
            this.log(response);
            callback();
        }));
    },
    titleChanged: function() {
        if (this.chu) {
            this.chu.title = this.$.title.getValue();
            this.updateChu();
        }
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
        } else {
            this.$.secondaryPanels.setIndex(0);
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
            event.item.$.chuboxItem.setOwned(!this.chu || this.user.id == this.chu.user.id);
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
        chuisy.chuboxitem.list([["user", this.user.id]], enyo.bind(this, function(sender, response) {
            this.chuboxItems = response.objects;
            this.refreshChuboxItems();
        }));
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
        this.$.secondaryPanels.setIndex(2);
    },
    confirmTaggedPeople: function() {
        this.taggedPersons = this.$.taggedPeopleSelector.getSelectedItems();

        if (this.chu) {
            this.chu.tagged = this.taggedPersons;
            this.updateChu();
        }

        this.refreshTaggedPersons();
        this.$.secondaryPanels.setIndex(0);
    },
    addItem: function() {
        this.$.secondaryPanels.setIndex(3);
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
    },
    postChu: function() {
        var data = {
            title: this.$.title.getValue(),
            visibility: this.visibility,
            expandability: "public", // TODO: Add option to change this
            user: this.user,
            items: this.items,
            tagged: this.taggedPersons,
            visible_to: this.visibleTo,
            expandable_by: []
        };

        this.log(data);
        chuisy.chu.create(data, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
    },
    itemRemove: function(sender, event) {
        this.items.remove(event.index);

        if (this.chu) {
            this.chu.item = this.items;
            this.updateChu();
        }

        this.refreshChuItems();
    },
    itemCollect: function(sender, event) {
        var item = this.items[event.index];
        var data = {
            product: item.product.resource_uri,
            user: this.user.resource_uri
        };
        chuisy.chuboxitem.create(data, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
    },
    closeChu: function() {
        this.chu.closed = true;
        this.updateChu(enyo.bind(this, function() {
            this.doBack();
        }));
    },
    components: [
        {kind: "Scroller", fit: true, components: [
            {classes: "pageheader", components: [
                {kind: "onyx.InputDecorator", components: [
                    {kind: "onyx.Input", name: "title", placeholder: "Type title here...", onchange: "titleChanged"}
                ]},
                {kind: "Group", classes: "pageheader-radiobuttongroup", components: [
                    {kind: "Button", name: "publicButton", classes: "pageheader-radiobutton", content: "public", value: "public", ontap: "visibiltySelected"},
                    {classes: "enyo-inline", allowHtml: true, content: "&#183;"},
                    {kind: "Button", name: "privateButton", classes: "pageheader-radiobutton", content: "friends", value: "private", ontap: "visibiltySelected"},
                    {classes: "enyo-inline", allowHtml: true, content: "&#183;"},
                    {kind: "Button", name: "customButton", classes: "pageheader-radiobutton", content: "select", value: "custom", ontap: "visibiltySelected"}
                ]}
            ]},
            {components: [
                {kind: "Repeater", name: "taggedRepeater", classes: "chuview-taggedrepeater", onSetupItem: "setupTaggedPerson", components: [
                    {kind: "Image", name: "thumbnail", classes: "chuview-taggedrepeater-thumbnail", ontap: "tagPerson"}
                ]},
                {kind: "onyx.IconButton", src: "assets/images/plus.png", ontap: "tagPerson", classes: "chuview-tagbutton"},
                {classes: "chuview-location", components: [
                    {classes: "chuview-location-text", name: "locationText", content: "Tap to enter location..."},
                    {kind: "Image", src: "assets/images/map-marker.png", classes: "chuview-location-icon"}
                ]}
            ]},
            {style: "text-align: center;", components: [
                {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                    {kind: "ChuboxItem", ontap: "itemTap", onRemove: "itemRemove", onCollect: "itemCollect"},
                    {kind: "onyx.Button", content: "Add Item", name: "newItemButton", classes: "chuview-new-item", ontap: "addItem"}
                ]}
            ]},
            {kind: "onyx.Button", name: "postButton", classes: "chuview-post-button onyx-affirmative", content: "Post Chu", ontap: "postChu"}
        ]},
        {kind: "Panels", name: "secondaryPanels", draggable: false, classes: "secondarypanels shadow-left", components: [
            {components: [
                {kind: "onyx.Button", name: "closeButton", classes: "chuview-close-button onyx-negative", content: "Close Chu", ontap: "closeChu"}
            ]},
            {components: [
                {content: "Visible To"},
                {kind: "PeopleSelector", name: "visibilityPeopleSelector"},
                {kind: "onyx.Button", content: "OK", ontap: "confirmVisibilityPeople"}
            ]},
            {components: [
                {content: "Tagged People"},
                {kind: "PeopleSelector", name: "taggedPeopleSelector"},
                {kind: "onyx.Button", content: "OK", ontap: "confirmTaggedPeople"}
            ]},
            {components: [
                {content: "Choose an Item!"},
                {kind: "FlyweightRepeater", name: "chuboxList", classes: "enyo-fill", style: "width: 100%", onSetupItem: "setupChuboxItem", components: [
                    {kind: "ListChuboxItem", ontap: "itemSelected"}
                ]}
            ]}
        ]}
    ]
});