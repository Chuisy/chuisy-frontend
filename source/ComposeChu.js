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
        if (this.user) {
            this.$.chubox.setUser(this.user);
            this.$.chubox.setBoxOwner(this.user);
            this.loadFriends();
        }
    },
    rendered: function() {
        this.inherited(arguments);
    },
    initialize: function() {
        this.$.title.setValue("");
        this.visibility = "public";
        this.selectedItems = {};
        this.location = null;

        this.$[this.visibility + "Button"].setActive(true);
        this.$.friendsSelector.setSelectedItems([]);
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
            this.$.secondaryPanels.setIndex(0);
            this.openSecondarySlider();
        } else {
            this.closeSecondarySlider();
        }
    },
    setupTaggedPerson: function(sender, event) {
        var user = this.taggedPersons[event.index];
        event.item.$.thumbnail.setSrc(user.profile.avatar);
    },
    loadFriends: function() {
        chuisy.followingrelation.list(['user', this.user.id], enyo.bind(this, function(sender, response) {
            var users = [];
            for (var i=0; i<response.objects.length; i++) {
                users.push(response.objects[i].followee);
            }
            this.$.friendsSelector.setItems(users);
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
            comments: []
        };

        chuisy.chu.create(data, enyo.bind(this, function(sender, response) {
            this.log(response);
            this.doBack();
        }));
    },
    components: [
        {classes: "mainheader", content: "Chuisy", components: [
            {kind: "onyx.Button", ontap: "back", classes: "back-button", content: "back"},
            {classes: "mainheader-text", content: "Chuisy"}
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
                    // POST
                    {kind: "onyx.Button", name: "postButton", classes: "composechu-post-button onyx-affirmative", content: "Post Chu", ontap: "postChu"}
                ]}
            ]},
            {kind: "Slideable", overMoving: false, unit: "px", min: -330, max: 0, preventDragPropagation: true, classes: "secondaryslider", name: "secondarySlider", components: [
                {kind: "Panels", name: "secondaryPanels", arrangerKind: "CardArranger", draggable: false, animate: false, classes: "enyo-fill", components: [
                    // SELECT VISIBLE TO
                    {classes: "enyo-fill", components: [
                        {kind: "PeopleSelector", name: "friendsSelector", onChange: "friendsChanged"}
                    ]}
                ]}
            ]}
        ]}
    ]
});