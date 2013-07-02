/**
    View of the users Chu Box
*/
enyo.kind({
    name: "Closet",
    kind: "FittableRows",
    classes: "closet",
    events: {
        //* Gets fired when a chu is selected by tapping in it
        onShowChu: "",
        //* The user has tapped the create chu button
        onComposeChu: "",
        onBack: ""
    },
    handlers: {
        onpostresize: "postResize",
        onhold: "hold"
    },
    // Estimated width of a single chu
    chuWidth: 105,
    // Meta object for requests
    chusPerPage: 30,
    // Items in the chu box
    items: [],
    create: function() {
        this.inherited(arguments);
        chuisy.closet.on("reset add remove change", this.refresh, this);
    },
    rendered: function() {
        this.inherited(arguments);
        this.setupList();
    },
    postResize: function() {
        this.setupList();
        this.$.list.updateMetrics();
        this.refresh();
    },
    setupList: function() {
        this.buildCells();
        this.$.list.setRowsPerPage(Math.ceil(this.chusPerPage/this.cellCount));
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
            var c = this.$.listClient.createComponent({classes: "closet-chu", cellIndex: i, ontap: "chuTap", name: "chu" + i, owner: this, components: [
                {classes: "closet-chu-error-icon", name: "errorIcon" + i},
                {classes: "closet-chu-image", name: "chuImage" + i},
                {classes: "closet-delete-button", onhold: "deleteButtonHold", ontap: "removeButtonTapped", cellIndex: i}
            ]});
        }
    },
    setupItem: function(sender, event) {
        for (var i=0; i<this.cellCount; i++) {
            var index = event.index * this.cellCount + i;
            var chu = chuisy.closet.at(index);
            var c = this.$["chu" + i];
            c.removeClass("deleted");
            if (chu) {
                // Use local images over remote ones, thumbnails over full images
                var image = chu.get("localThumbnail") || chu.get("thumbnails") && chu.get("thumbnails")["100x100"] ||
                    chu.get("localImage") || chu.get("image") || "assets/images/chu_placeholder.png";
                this.$["chuImage" + i].applyStyle("background-image", "url(" + image + ")");
                c.applyStyle("visibility", "visible");
                var syncStatus = chu.get("syncStatus");
                this.$["errorIcon" + i].setShowing(syncStatus == "postFailed" || syncStatus == "uploadFailed");
                c.applyStyle("-webkit-animation-delay", (Math.random()/5-0.2) + "s");
                c.addRemoveClass("wiggle", this.editing);
            } else {
                c.applyStyle("visibility", "hidden");
            }
        }

        var isLastRow = chuisy.closet.length && event.index+1 == Math.ceil(chuisy.closet.length / this.cellCount);
        this.$.listClient.applyStyle("margin-bottom", isLastRow ? "8px" : "0");

        return true;
    },
    /**
        Get items from sdk and update List
    */
    refresh: function() {
        this.$.list.setCount(Math.ceil(chuisy.closet.length / this.cellCount));
        this.$.list.refresh();
        this.$.placeholder.setShowing(!chuisy.closet.length);
    },
    /**
        Start edit mode in which the user can delete chus
    */
    startEditing: function(sender, event) {
        this.editing = true;
        // this.$.doneButton.show();
        this.$.postButton.hide();
        this.addClass("editing");
        this.$.editHint.setContent($L("(hold to cancel)"));
        this.refresh();
    },
    /**
        Finish edit mode
    */
    finishEditing: function() {
        this.editing = false;
        this.removeClass("editing");
        this.$.postButton.show();
        this.$.editHint.setContent($L("(hold to edit)"));
        this.refresh();
    },
    chuTap: function(sender, event) {
        if (!this.editing) {
            var index = event.index * this.cellCount + sender.cellIndex;
            this.doShowChu({chu: chuisy.closet.at(index)});
        }
        // Call this to prevent event propagating to an input element and focussing it
        // Happens on iOS sometimes
        event.preventDefault();
    },
    removeButtonTapped: function(sender, event) {
        App.confirm(
            $L("Remove Chu"),
            $L("Are you sure you want to remove this Chu? This action can not be undone."),
            enyo.bind(this, function(choice) {
                if (choice) {
                    this.removeChu(sender, event);
                }
            }),
            [$L("Cancel"), $L("Remove")]
        );
        return true;
    },
    deleteButtonHold: function(sender, event) {
        return true;
    },
    /**
        Event handler. Remove chu associated with the event.
    */
    removeChu: function(sender, event) {
        var index = event.index * this.cellCount + sender.cellIndex;
        var chu = chuisy.closet.at(index);
        this.$.list.performOnRow(event.index, function(index, cellIndex) {
            this.$["chu" + sender.cellIndex].addClass("deleted");
        }, this, event.index, sender.cellIndex);
        setTimeout(function() {
            chu.destroy();
        }, 300);
    },
    hold: function(sender, event) {
        if (this.editing) {
            this.finishEditing();
        } else {
            this.startEditing();
        }
        // this.openContextMenu(sender, event);
    },
    // openContextMenu: function(sender, event) {
    //     this.$.contextMenu.show();
    //     this.$.contextMenu.removeClass("unfolded");
    //     this.$.contextMenu.addClass("unfolded");
    //     var bounds = this.$.contextMenu.getBounds();
    //     // sender.hasNode();
    //     // var targetBounds = sender.getBounds();
    //     // sender.applyStyle("background-color", "orange");
    //     var x = event.clientX - bounds.width/2;
    //     var y = event.clientY - bounds.height/2;
    //     this.$.contextMenu.applyStyle("top", y + "px");
    //     this.$.contextMenu.applyStyle("left", x + "px");
    // },
    activate: function() {
        this.$.list.show();
        this.resized();
    },
    deactivate: function() {
        this.$.list.hide();
    },
    components: [
        {showing: false, classes: "closet-edit-hint", components: [
            {name: "editHint", classes: "closet-edit-hint-text", content: $L("(hold to edit)")}
        ]},
        {kind: "Signals", onClosetUpdated: "refresh"},
        {name: "postButton", classes: "post-chu-button", ontap: "doComposeChu"},
        {name: "contextMenu", classes: "closet-contextmenu", components: [
            {classes: "closet-contextmenu-left"},
            {classes: "closet-contextmenu-right"}
        ]},
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", content: $L("Your Closet")},
            {kind: "Button", ontap: "startEditing", classes: "header-button right closet-edit-button", content: $L("edit")},
            {kind: "Button", ontap: "finishEditing", classes: "header-button right closet-done-button", content: $L("done")}
        ]},
        {classes: "placeholder", name: "placeholder", components: [
            {classes: "placeholder-image"},
            {classes: "placeholder-text", content: $L("Your closet is still empty? Fill it while shopping!")}
        ]},
        // LIST
        {kind: "List", fit: true, thumb: false, classes: "closet-list", name: "list", onSetupItem: "setupItem", strategyKind: "TransitionScrollStrategy", components: [
            {name: "listClient", classes: "closet-row"}
        ]}
    ]
});