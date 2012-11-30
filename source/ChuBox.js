enyo.kind({
    name: "ChuBox",
    kind: "FittableRows",
    classes: "chubox",
    events: {
        onChuSelected: "",
        onToggleMenu: "",
        onComposeChu: "",
        onShowNotifications: ""
    },
    handlers: {
        onpostresize: "postResize"
    },
    chuWidth: 105,
    meta: {
        offset: 0,
        limit: 60
    },
    items: [],
    rendered: function() {
        this.inherited(arguments);
        this.buildCells();
    },
    postResize: function() {
        this.buildCells();
        this.refresh();
    },
    buildCells: function() {
        if (!this.hasNode() || !this.getBounds().width || !this.getBounds().height) {
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
                var image = chu.localImage || (chu.thumbnails ? chu.thumbnails["100x100"] : chu.image) || "assets/images/chu_placeholder.png";
                this.$["chuImage" + i].applyStyle("background-image", "url(" + image + ")");
                this.$["chu" + i].applyStyle("visibility", "visible");
            } else {
                this.$["chu" + i].applyStyle("visibility", "hidden");
            }
        }

        return true;
    },
    refresh: function() {
        this.items = chuisy.chubox.getChus();
        this.$.list.setCount(Math.ceil(this.items.length / this.cellCount));
        this.$.list.refresh();
    },
    startEditing: function(sender, event) {
        this.editing = true;
        this.$.notificationsButton.hide();
        this.$.doneButton.show();
        this.$.postButton.hide();
        this.addClass("editing");
    },
    finishEditing: function() {
        this.editing = false;
        this.removeClass("editing");
        this.$.doneButton.hide();
        this.$.postButton.show();
        this.$.notificationsButton.show();
    },
    chuTap: function(sender, event) {
        if (!this.editing) {
            var index = event.index * this.cellCount + sender.cellIndex;
            this.doChuSelected({chu: this.items[index]});
        }
    },
    chuRemove: function(sender, event) {
        var index = event.index * this.cellCount + sender.cellIndex;
        var chu = this.items[index];
        chuisy.chubox.remove(chu);
        return true;
    },
    notificationsUpdated: function(sender, event) {
        this.$.notificationBadge.setContent(event.unread_count);
        this.$.notificationBadge.setShowing(event.unread_count);
        return true;
    },
    hold: function(sender, event) {
        this.startEditing();
        this.openContextMenu(sender, event);
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
    components: [
        {kind: "Signals", onChuboxUpdated: "refresh", onNotificationsUpdated: "notificationsUpdated"},
        {name: "postButton", classes: "post-chu-button", ontap: "doComposeChu"},
        {name: "contextMenu", classes: "chubox-contextmenu", components: [
            {classes: "chubox-contextmenu-left"},
            {classes: "chubox-contextmenu-right"}
        ]},
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", name: "menuButton", components: [
                {classes: "menu-button-icon"}
            ]},
            {classes: "mainheader-text", content: "Chu Box"},
            {kind: "onyx.Button", ontap: "finishEditing", classes: "done-button", content: "done", name: "doneButton", showing: false},
            {kind: "onyx.Button", name: "notificationsButton", classes: "notification-button", ontap: "doShowNotifications", components: [
                {classes: "notification-button-icon"},
                {classes: "notification-button-badge", name: "notificationBadge", content: "0", showing: false}
            ]}
        ]},
        {kind: "List", fit: true, classes: "chubox-list", name: "list", onSetupItem: "setupItem", components: [
            {name: "listClient", classes: "chubox-row"}
        ]}
    ]
});