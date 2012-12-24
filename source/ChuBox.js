/**
    View of the users Chu Box
*/
enyo.kind({
    name: "ChuBox",
    kind: "FittableRows",
    classes: "chubox",
    events: {
        //* Gets fired when a chu is selected by tapping in it
        onShowChu: "",
        //* The user has tapped on the menu button
        onToggleMenu: "",
        //* The user has tapped the create chu button
        onComposeChu: "",
        //* The user has tapped the notification button
        onShowNotifications: ""
    },
    handlers: {
        onpostresize: "postResize"
    },
    // Estimated width of a single chu
    chuWidth: 105,
    // Meta object for requests
    meta: {
        offset: 0,
        limit: 60
    },
    // Items in the chu box
    items: [],
    rendered: function() {
        this.inherited(arguments);
        this.setupList();
    },
    postResize: function() {
        this.setupList();
        this.refresh();
    },
    setupList: function() {
        this.buildCells();
        this.$.list.setRowsPerPage(Math.ceil(this.meta.limit/this.cellCount));
    },
    /**
        Build the cells for the List. The wider the screen the more cells have to be created
    */
    buildCells: function() {
        if (!this.hasNode() || !this.getBounds().width || !this.getBounds().height) {
            // Can't calculate bounds yet
            return;
        }

        this.cellCount = Math.floor(this.getBounds().width / this.chuWidth);

        this.$.listClient.destroyClientControls();
        for (var i=0; i<this.cellCount; i++) {
            this.$.listClient.createComponent({classes: "chubox-chu", cellIndex: i, ontap: "chuTap", onhold: "hold", name: "chu" + i, owner: this, components: [
                {classes: "chubox-chu-image", name: "chuImage" + i},
                {classes: "chubox-delete-button", ontap: "chuRemove", cellIndex: i}
            ]});
        }
    },
    setupItem: function(sender, event) {
        for (var i=0; i<this.cellCount; i++) {
            var index = event.index * this.cellCount + i;
            var chu = this.items[index];

            if (chu) {
                // Use local images over remote ones, thumbnails over full images
                var image = chu.localThumbnail || chu.localImage ||
                    (chu.thumbnails ? chu.thumbnails["100x100"] : chu.image) ||
                    "assets/images/chu_placeholder.png";
                this.$["chuImage" + i].applyStyle("background-image", "url(" + image + ")");
                this.$["chu" + i].applyStyle("visibility", "visible");
            } else {
                this.$["chu" + i].applyStyle("visibility", "hidden");
            }
        }

        return true;
    },
    /**
        Get items from sdk and update List
    */
    refresh: function() {
        this.items = chuisy.chubox.getChus();
        this.$.list.setCount(Math.ceil(this.items.length / this.cellCount));
        this.$.list.refresh();
        this.$.placeholder.setShowing(!this.items.length);
    },
    /**
        Start edit mode in which the user can delete chus
    */
    startEditing: function(sender, event) {
        this.editing = true;
        // this.$.doneButton.show();
        this.$.postButton.hide();
        this.addClass("editing");
    },
    /**
        Finish edit mode
    */
    finishEditing: function() {
        this.editing = false;
        this.removeClass("editing");
        this.$.postButton.show();
    },
    chuTap: function(sender, event) {
        if (!this.held) {
            var index = event.index * this.cellCount + sender.cellIndex;
            this.doShowChu({chu: this.items[index]});
        }
        this.held = false;
        // Call this to prevent event propagating to an input element and focussing it
        // Happens on iOS sometimes
        event.preventDefault();
    },
    /**
        Event handler. Remove chu associated with the event.
    */
    chuRemove: function(sender, event) {
        var index = event.index * this.cellCount + sender.cellIndex;
        var chu = this.items[index];
        chuisy.chubox.remove(chu);
        return true;
    },
    hold: function(sender, event) {
        this.held = true;
        if (this.editing) {
            this.finishEditing();
        } else {
            this.startEditing();
        }
        // this.openContextMenu(sender, event);
    },
    openContextMenu: function(sender, event) {
        this.$.contextMenu.show();
        this.$.contextMenu.removeClass("unfolded");
        this.$.contextMenu.addClass("unfolded");
        var bounds = this.$.contextMenu.getBounds();
        // sender.hasNode();
        // var targetBounds = sender.getBounds();
        // sender.applyStyle("background-color", "orange");
        var x = event.clientX - bounds.width/2;
        var y = event.clientY - bounds.height/2;
        this.$.contextMenu.applyStyle("top", y + "px");
        this.$.contextMenu.applyStyle("left", x + "px");
    },
    activate: function() {},
    deactivate: function() {
        this.finishEditing();
    },
    components: [
        {kind: "Signals", onChuboxUpdated: "refresh"},
        {name: "postButton", classes: "post-chu-button", ontap: "doComposeChu"},
        {name: "contextMenu", classes: "chubox-contextmenu", components: [
            {classes: "chubox-contextmenu-left"},
            {classes: "chubox-contextmenu-right"}
        ]},
        {classes: "chubox-placeholder absolute-center", name: "placeholder"},
        // LIST
        {kind: "List", fit: true, classes: "chubox-list", name: "list", onSetupItem: "setupItem", components: [
            {name: "listClient", classes: "chubox-row"}
        ]}
    ]
});