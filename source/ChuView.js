enyo.kind({
    name: "ChuView",
    classes: "chuview",
    kind: "FittableColumns",
    published: {
        user: null,
        chu: null
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
            this.$[this.chu.visibility + "Button"].setActive(true);
            this.items = this.chu.items;
            this.taggedPersons = this.chu.tagged;
        } else {
            this.$.title.setValue("");
            this.$.publicButton.setActive(true);
            this.items = [];
            this.taggedPersons = [];
        }
        this.$.postButton.setShowing(!this.chu);
        this.addRemoveClass("owned", this.user && this.chu && this.chu.user.id == this.user.profile.id);
        this.refreshChuItems();
        this.refreshTaggedPersons();
    },
    clear: function() {
        this.chu = null;
        this.chuChanged();
    },
    visibiltySelected: function(sender, event) {
        if (event.originator.getActive()) {
            var value = event.originator.value;
            if (this.chu) {
                this.chu.visibility = value;
            }

            if (value == "custom") {
                this.$.secondaryPanels.setIndex(1);
            }
        }
    },
    confirmVisibilityPeople: function() {
        var people = this.$.visibilityPeopleSelector.getSelectedItems();
        var peopleUris = [];
        for (var i=0; i<people.length; i++) {
            peopleUris.push(people[i].resource_uri);
        }

        if (this.chu) {
            this.chu.visible_to =  peopleUris;
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
        var peopleUris = [];
        for (var i=0; i<this.taggedPersons.length; i++) {
            peopleUris.push(this.taggedPersons[i].resource_uri);
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
        this.refreshChuItems();
        this.$.secondaryPanels.setIndex(0);
    },
    components: [
        {kind: "Scroller", fit: true, components: [
            {classes: "pageheader", components: [
                {kind: "onyx.InputDecorator", components: [
                    {kind: "onyx.Input", name: "title", placeholder: "Type title here..."}
                ]},
                {kind: "Group", classes: "pageheader-radiobuttongroup", onActivate: "visibiltySelected", components: [
                    {kind: "Button", name: "publicButton", classes: "pageheader-radiobutton", content: "public", value: "public", ontap: "publicTapped"},
                    {classes: "enyo-inline", allowHtml: true, content: "&#183;"},
                    {kind: "Button", name: "privateButton", classes: "pageheader-radiobutton", content: "friends", value: "private", ontap: "showImpressum"},
                    {classes: "enyo-inline", allowHtml: true, content: "&#183;"},
                    {kind: "Button", name: "customButton", classes: "pageheader-radiobutton", content: "select", value: "custom", ontap: "showContact"}
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
                    {kind: "ChuboxItem", onclick: "itemTap"},
                    {kind: "onyx.Button", content: "Add Item", name: "newItemButton", classes: "chuview-new-item", ontap: "addItem"}
                ]}
            ]},
            {kind: "onyx.Button", name: "postButton", classes: "chuview-post-button onyx-affirmative", content: "Post Chu"}
        ]},
        {kind: "Panels", name: "secondaryPanels", draggable: false, classes: "secondarypanels shadow-left", components: [
            {components: [
                {kind: "onyx.Button", name: "closeButton", classes: "chuview-close-button onyx-negative", content: "Close Chu"}
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