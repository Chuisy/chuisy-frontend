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
    userChanged: function() {
        this.loadChuboxItems();
    },
    clear: function() {
        this.$.title.setValue("");
        this.visibility = "public";
        this.items = [];
        this.visibleTo = [];
        this.taggedPersons = [];
        this.location = null;

        this.$[this.visibility + "Button"].setActive(true);
        this.refreshChuItems();
        this.refreshTaggedPersons();
        this.$.visibilityPeopleSelector.setSelectedItems(this.visibleTo);
        this.$.taggedPeopleSelector.setSelectedItems(this.taggedPersons);
        this.$.locationPicker.setLocation(this.location);
        this.updateLocationText();
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
    openSecondarySlider: function() {
        this.$.secondarySlider.animateToMin();
    },
    closeSecondarySlider: function() {
        this.$.secondarySlider.animateToMax();
    },
    visibiltySelected: function(sender, event) {
        var value = sender.value;

        this.visibility = value;

        if (value == "custom") {
            this.$.secondaryPanels.setIndex(0);
            this.openSecondarySlider();
        } else {
            this.closeSecondarySlider();
        }
    },
    confirmVisibilityPeople: function() {
        var people = this.$.visibilityPeopleSelector.getSelectedItems();

        this.visibleTo = people;
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
            event.item.$.chuItem.setItem(item);
            event.item.$.chuItem.setUser(this.user);
            event.item.$.chuItem.setChu(this.chu);
            event.item.$.newItemButton.hide();
            event.item.$.chuItem.show();
        } else {
            event.item.$.chuItem.hide();
            event.item.$.newItemButton.show();
        }
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
        this.$.chuboxRepeater.setCount(this.chuboxItems.length);
        this.$.chuboxRepeater.render();
    },
    setupChuboxItem: function(sender, event) {
        var item = this.chuboxItems[event.index];
        event.item.$.chuboxItem.setItem(item);
    },
    tagPerson: function() {
        this.$.secondaryPanels.setIndex(1);
        this.openSecondarySlider();
    },
    confirmTaggedPeople: function() {
        this.taggedPersons = this.$.taggedPeopleSelector.getSelectedItems();

        this.refreshTaggedPersons();
        this.closeSecondarySlider();
    },
    addItem: function() {
        this.$.secondaryPanels.setIndex(2);
        this.openSecondarySlider();
    },
    itemSelected: function(sender, event) {
        var item = this.chuboxItems[event.index];
        this.items.push(item);

        this.refreshChuItems();
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
            this.doBack();
        }));
    },
    itemTap: function(sender, event) {
        // var item = this.items[event.index];
    },
    itemRemove: function(sender, event) {
        this.items.remove(event.index);

        this.refreshChuItems();
    },
    changeLocation: function() {
        this.$.secondaryPanels.setIndex(3);
        this.$.locationPicker.initialize();
        this.openSecondarySlider();
    },
    locationPickerBack: function() {
        this.closeSecondarySlider();
    },
    locationPickerChanged: function() {
        this.location = this.$.locationPicker.getLocation();
        this.updateLocationText();
    },
    updateLocationText: function() {
        // this.$.locationText.setContent(this.location ? this.location.address : "Tap to enter location...");
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
    locationPickerDrag: function() {
        // Prevent drag event to propagate to slider
        return true;
    },
    back: function() {
        if (this.$.secondarySlider.getValue() == this.$.secondarySlider.getMin()) {
            this.closeSecondarySlider();
        } else {
            this.doBack();
        }
    },
    components: [
        {kind: "FittableColumns", classes: "mainheader", content: "Chuisy", components: [
            {kind: "onyx.Button", ontap: "back", classes: "back-button", content: "back"},
            {classes: "mainheader-text", content: "Chuisy"}
        ]},
        {style: "position: relative;", fit: true, components: [
            {kind: "Scroller", classes: "enyo-fill", style: "padding: 10px; box-sizing: border-box;", components: [
                // TITLE
                {kind: "onyx.InputDecorator", style: "width: 100%; box-sizing: border-box;", alwaysLooksFocused: true, components: [
                    {kind: "onyx.TextArea", style: "width: 100%;", name: "title", placeholder: "Type title here...", onchange: "titleChanged"}
                ]},
                {style: "height: 38px;", components: [
                    // TAGGED
                    {kind: "Repeater", name: "taggedRepeater", classes: "composechu-taggedrepeater", onSetupItem: "setupTaggedPerson", components: [
                        {kind: "Image", name: "thumbnail", classes: "miniavatar composechu-taggedrepeater-thumbnail", ontap: "tagPerson"}
                    ]},
                    {name: "tagButton", ontap: "tagPerson", classes: "composechu-tag-button"},
                    // LOCATION
                    {kind: "onyx.Button", classes: "composechu-location-button", name: "locationButton", ontap: "changeLocation", components: [
                        // {classes: "composechu-location-text", name: "locationText"},
                        {kind: "Image", src: "assets/images/location.png"}
                    ]}
                ]},
                // ITEMS
                {style: "text-align: center;", components: [
                    {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                        {kind: "ChuItem", ontap: "itemTap"},
                        {kind: "onyx.Button", content: "Add Item", name: "newItemButton", classes: "composechu-new-item", ontap: "addItem"}
                    ]}
                ]},
                {components: [
                    // VISIBILITY
                    {kind: "Group", classes: "composechu-visibility-selector", components: [
                        {kind: "Button", name: "publicButton", classes: "pageheader-radiobutton", content: "public", value: "public", ontap: "visibiltySelected"},
                        {classes: "enyo-inline", allowHtml: true, content: "&#183;"},
                        {kind: "Button", name: "privateButton", classes: "pageheader-radiobutton", content: "friends", value: "private", ontap: "visibiltySelected"},
                        {classes: "enyo-inline", allowHtml: true, content: "&#183;"},
                        {kind: "Button", name: "customButton", classes: "pageheader-radiobutton", content: "select", value: "custom", ontap: "visibiltySelected"}
                    ]},
                    // POST
                    {kind: "onyx.Button", name: "postButton", classes: "composechu-post-button onyx-affirmative", content: "Post Chu", ontap: "postChu"}
                ]}
            ]},
            {kind: "Slideable", overMoving: false, unit: "px", min: -330, max: 0, preventDragPropagation: true, classes: "secondaryslider", name: "secondarySlider", components: [
                {kind: "Panels", name: "secondaryPanels", arrangerKind: "CardArranger", draggable: false, classes: "enyo-fill", components: [
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
                            {kind: "Repeater", name: "chuboxRepeater", onSetupItem: "setupChuboxItem", components: [
                                {kind: "MiniChuboxItem", name: "chuboxItem", ontap: "itemSelected"}
                            ]}
                        ]}
                    ]},
                    // PICK LOCATION
                    {classes: "enyo-fill", style: "position: relative", components: [
                        {kind: "LocationPicker", classes: "enyo-fill", onLocationChanged: "locationPickerChanged", ondrag: "locationPickerDrag"}
                    ]}
                ]}
            ]}
        ]}
    ]
});