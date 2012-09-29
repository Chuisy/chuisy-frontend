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
            this.refreshTaggedPersons();
            this.refreshChuItems();
        } else {
            this.$.title.setValue("");
            this.$.publicButton.setActive(true);
            this.refreshTaggedPersons();
            this.refreshChuItems();
        }
        this.$.postButton.setShowing(!this.chu);
        this.addRemoveClass("owned", this.user && this.chu && this.chu.user.id == this.user.profile.id);
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
        this.$.taggedRepeater.setCount(this.chu ? this.chu.tagged.length : 0);
        this.$.taggedRepeater.render();
    },
    refreshChuItems: function() {
        this.$.itemRepeater.setCount(this.chu ? this.chu.items.length : 0);
        this.$.itemRepeater.render();
    },
    setupTaggedPerson: function(sender, event) {
        var profile = this.chu.tagged[event.index];
        event.item.$.thumbnail.setSrc(profile.avatar);
    },
    setupRepeaterItem: function(sender, event) {
        var c = event.item.$.chuboxItem;
        var item = this.chu.items[event.index];
        c.setItem(item);
        var rot = Math.random() * 20 - 10; // Rotate by a random angle between -10 and 10 deg
        // c.applyStyle("transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-webkit-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-ms-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-moz-transform", "rotate(" + rot + "deg)");
        // c.applyStyle("-o-transform", "rotate(" + rot + "deg)");
    },
    loadChuboxItems: function() {
        chuisy.chuboxitem.list([["user", this.user.profile.id]], enyo.bind(this, function(sender, response) {
            this.chuboxItems = response.objects;
            this.refreshChuboxItems();
        }));
    },
    refreshChuboxItems: function() {
        this.$.chuboxList.setCount(this.chuboxItems.length);
        this.$.chuboxList.refresh();
    },
    setupChuboxItem: function(sender, event) {
        var item = this.chuboxItems[event.index];
        this.$.chuboxListItem.setItem(item);
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
                    {kind: "Image", name: "thumbnail", classes: "chuview-taggedrepeater-thumbnail"}
                ]},
                {kind: "Button", ontap: "tagPerson", content: "+", classes: "chuview-tagbutton"},
                {classes: "chuview-location", components: [
                    {classes: "chuview-location-text", name: "locationText", content: "Tap to enter location..."},
                    {kind: "Image", src: "assets/images/map-marker.png", classes: "chuview-location-icon"}
                ]}
            ]},
            {style: "text-align: center;", components: [
                {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                    {kind: "ChuboxItem", onclick: "itemTap"}
                ]}
            ]},
            {kind: "onyx.Button", name: "postButton", classes: "chuview-post-button onyx-affirmative", content: "Post Chu"}
        ]},
        {kind: "Panels", name: "secondaryPanels", draggable: false, classes: "secondarypanels shadow-left", components: [
            {components: [
                {kind: "onyx.Button", name: "closeButton", classes: "chuview-close-button onyx-negative", content: "Close Chu"}
            ]},
            {components: [
                {kind: "PeopleSelector", name: "visibilityPeopleSelector"},
                {kind: "onyx.Button", content: "OK", ontap: "confirmVisibilityPeople"}
            ]}
            // {kind: "List", name: "chuboxList", classes: "enyo-fill", style: "width: 100%", onSetupItem: "setupChuboxItem", components: [
            //     {kind: "ListChuboxItem"}
            // ]}
        ]}
    ]
});