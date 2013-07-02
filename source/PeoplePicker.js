/**
    _PeoplePicker_ is a kind for picking multiple persons from a list of people (_items_)
*/
enyo.kind({
    name: "PeoplePicker",
    classes: "peoplepicker",
    kind: "FittableRows",
    published: {
        // List of people to pick from
        items: []
    },
    events: {
        // Is sent whenever a person is selected or unselected
        onChange: "",
        onDone: "",
        onInviteFriends: ""
    },
    create: function() {
        this.inherited(arguments);
        this.selectedItems = {};
        this.selectedItemsArray= [];
        this.filteredItems = [];
    },
    itemsChanged: function() {
        this.filteredItems = this.items;
        this.refreshList();
        this.$.panels.setIndex(this.items.length ? 0 : 1);
    },
    /**
        Marks all _items_ as selected
    */
    setSelectedItems: function(items) {
        this.selectedItems = {};
        for (var i=0; i<items.length; i++) {
            this.selectedItems[items[i].id] = items[i];
        }
        this.refreshList();
    },
    /**
        Gets all the selected people as an array
    */
    getSelectedItems: function() {
        var items = [];
        for (var x in this.selectedItems) {
            items.push(this.selectedItems[x]);
        }
        return items;
    },
    /**
        Checks if a specific person is selected
    */
    isSelected: function(item) {
        var found = this.selectedItems[item.id];
        return found !== undefined && found !== null;
    },
    keyupHandler: function(sender, event) {
        var searchString = this.$.searchInput.getValue();

        if (searchString) {
            // Filter items by full name and user name
            this.filteredItems = this.items.filter(enyo.bind(this, function(item) {
                var fullName = item.get("first_name") + " " + item.get("last_name");
                var pattern = new RegExp(searchString, "i");
                return item.get("username").search(pattern) != -1 ||
                    fullName.search(pattern) != -1 ||
                    this.isSelected(item);
            }));

            this.refreshList();
        } else {
            this.filteredItems = this.items;
            this.refreshList();
        }
    },
    itemTap: function(sender, event) {
        var item = this.filteredItems[event.index];
        if (!this.isSelected(item)) {
            this.selectItem(item);
        } else {
            this.deselectItem(item);
        }
        sender.addRemoveClass("selected", this.isSelected(item));
        this.$.list.renderRow(event.index);
    },
    /**
        Select a specific _item_
    */
    selectItem: function(item) {
        this.selectedItems[item.id] = item;
        this.doChange();
    },
    /**
        Deselect a specific _item_
    */
    deselectItem: function(item) {
        delete this.selectedItems[item.id];
        this.doChange();
    },
    /**
        Refresh the people repeater
    */
    refreshList: function() {
        this.$.list.setCount(this.filteredItems.length);
        // this.$.list.render();
        this.$.list.build();
    },
    setupItem: function(sender, event) {
        var item = this.filteredItems[event.index];
        event.item.$.avatar.setSrc(item.profile.get("avatar_thumbnail") || "assets/images/avatar_thumbnail_placeholder.png");
        event.item.$.fullName.setContent(item.get("first_name") + " " + item.get("last_name"));
        event.item.$.item.addRemoveClass("selected", this.isSelected(item));
        return true;
    },
    components: [
        {classes: "header", components: [
            {kind: "Button", ontap: "doDone", classes: "header-button right", content: $L("done")}
        ]},
        {kind: "Panels", fit: true, animate: false, draggable: false, components: [
            {kind: "FittableRows", components: [
                // SEARCH INPUT
                {kind: "SearchInput", name: "searchInput", classes: "discover-searchinput", onCancel: "searchInputCancel", onkeyup: "keyupHandler"},
                {kind: "Scroller", strategyKind: "TransitionScrollStrategy", thumb: false, fit: true, components: [
                    {kind: "Repeater", name: "list", onSetupItem: "setupItem", ontap: "itemTap", components: [
                        {classes: "list-item userlistitem peoplepicker-item", name: "item", components: [
                            {kind: "Image", classes: "userlistitem-avatar", name: "avatar"},
                            {classes: "userlistitem-fullname ellipsis", name: "fullName"},
                            {classes: "peoplepicker-item-light"}
                        ]}
                    ]}
                ]}
            ]},
            {classes: "peoplepicker-placeholder", components: [
                {classes: "peoplepicker-placeholder-card absolute-center", components: [
                    {kind: "Image", src: "assets/images/friends_placeholder.png", classes: "peoplepicker-placeholder-image"},
                    {classes: "peoplepicker-placeholder-text", content: $L("It seems you don't have any friends on Chuisy yet. Friends are people you follow that follow you back.")},
                    {kind: "Button", classes: "peoplepicker-invite-friends-button", ontap: "doInviteFriends", content: $L("Invite Friends")}
                ]}
            ]}
        ]}
    ]
});