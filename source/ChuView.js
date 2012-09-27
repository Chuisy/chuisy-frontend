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
        this.chuChanged();
    },
    userChanged: function() {
        this.loadChuboxItems();
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
    },
    clear: function() {
        this.chu = null;
        this.chuChanged();
    },
    visibiltySelected: function(sender, event) {
        if (event.originator.getActive()) {
            var value = event.originator.value;
            if (value == 'custom') {
            } else {
                this.chu.visibility = value;
            }
        }
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
        {kind: "FittableRows", fit: true, components: [
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
            {kind: "Scroller", style: "text-align: center;", fit: true, components: [
                {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                    {kind: "ChuboxItem", onclick: "itemTap"}
                ]}
            ]}
        ]},
        {kind: "Panels", name: "secondaryPanels", draggable: false, classes: "secondarypanels shadow-left", components: [
            {kind: "List", name: "chuboxList", classes: "enyo-fill", onSetupItem: "setupChuboxItem", components: [
                {kind: "ChuboxListItem"}
            ]}
        ]}
    ]
});