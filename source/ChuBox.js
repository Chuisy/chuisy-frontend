enyo.kind({
    name: "ChuBox",
    classes: "chubox",
    events: {
        onChuSelected: "",
        onToggleMenu: "",
        onComposeChu: "",
        onShowNotifications: ""
    },
    handlers: {
        onhold: "startEditing",
        onresize: "resized"
    },
    chuWidth: 100,
    meta: {
        offset: 0,
        limit: 60
    },
    items: [],
    rendered: function() {
        this.inherited(arguments);
        this.buildCells();
    },
    resized: function() {
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
            this.$.listClient.createComponent({classes: "chubox-chu", cellIndex: i, ontap: "chuTap", name: "chu" + i, owner: this, components: [
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
                var image = chu.thumbnails && chu.thumbnails["100x100"] ? chu.thumbnails["100x100"] : chu.image;
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
        event.preventDefault();
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
    components: [
        {kind: "FittableRows", classes: "enyo-fill", components: [
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
            {kind: "List", fit: true, classes: "enyo-fill chubox-list", name: "list", onSetupItem: "setupItem", components: [
                {name: "listClient", classes: "chubox-row"}
            ]}
        ]},
        {kind: "Signals", onChuboxUpdated: "refresh", onNotificationsUpdated: "notificationsUpdated"},
        {name: "postButton", classes: "post-chu-button", ontap: "doComposeChu"}

    ]
});