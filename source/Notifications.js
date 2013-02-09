/**
    _Notifications_ is a view for displaying all of the users notifications
*/
enyo.kind({
    name: "Notifications",
    classes: "notifications",
    events: {
        // User has tapped a notification
        onNotificationSelected: ""
    },
    create: function() {
        this.inherited(arguments);
        chuisy.notifications.on("reset add", this.refresh, this);
    },
    /**
        Refreshes notification list with loaded items
    */
    refresh: function() {
        this.$.list.setCount(chuisy.notifications.length);
        this.$.list.refresh();
        this.$.placeholder.setShowing(!chuisy.notifications.length);
    },
    setupItem: function(sender, event) {
        var item = chuisy.notifications.at(event.index);

        if (item.get("text")) {
            this.$.text.setContent(item.get("text"));
        } else {
            switch (item.get("action")) {
                case "like":
                    this.$.text.setContent($L("<strong>{{ name }}</strong> has <strong>liked</strong> a <strong>Chu</strong> you are subscribed to.").replace("{{ name }}", item.get("actor").first_name));
                    break;
                case "comment":
                    this.$.text.setContent($L("<strong>{{ name }}</strong> has <strong>commented</strong> on a <strong>Chu</strong> you are subscribed to.").replace("{{ name }}", item.get("actor").first_name));
                    break;
                case "follow":
                    this.$.text.setContent($L("<strong>{{ name }}</strong> is now <strong>following</strong> you.").replace("{{ name }}", item.get("actor").first_name));
                    break;
                case "share":
                    this.$.text.setContent($L("<strong>{{ name }}</strong> has <strong>shared</strong> a <strong>Chu</strong> with you.").replace("{{ name }}", item.get("actor").first_name));
                    break;
            }
        }

        this.$.image.setSrc(item.get("thumbnail") || "");
        this.$.notification.addRemoveClass("read", item.get("read"));

        var isLastItem = event.index == chuisy.notifications.length-1;
        if (isLastItem && chuisy.notifications.hasNextPage()) {
            // Last item in the list and there is more! Load next page
            this.$.loadingNextPage.show();
            chuisy.notifications.fetchNext();
        } else {
            this.$.loadingNextPage.hide();
        }

        return true;
    },
    notificationTapped: function(sender, event) {
        var not = chuisy.notifications.at(event.index);
        if (App.checkConnection() && not.get("uri")) {
            this.doNotificationSelected({notification: not});
            if (!not.get("read")) {
                // Mark notification as read
                not.save({read: true});
                this.refresh();
            }
        }
    },
    /**
        Mark all notifications as seen
    */
    seen: function() {
        chuisy.notifications.seen();
    },
    activate: function() {
        enyo.Signals.send("onShowGuide", {view: "notifications"});
        this.seen();
    },
    deactivate: function() {},
    components: [
        {classes: "placeholder", name: "placeholder", components: [
            {classes: "placeholder-image"},
            {classes: "placeholder-text", content: $L("There aren't any affairs that require your attention right now...")}
        ]},
        {kind: "List", name: "list", onSetupItem: "setupItem", rowsPerPage: 20, classes: "enyo-fill", components: [
            {classes: "notifications-notification", name: "notification", ontap: "notificationTapped", components: [
                {classes: "notifications-notification-header", components: [
                    {classes: "notifications-notification-seperator"},
                    {kind: "Image", classes: "notifications-notification-image", name: "image"},
                    {classes: "notifications-notification-seperator"}
                ]},
                {classes: "notifications-notification-text", name: "text", allowHtml: true}
            ]},
            {name: "loadingNextPage", content: $L("Loading..."), classes: "loading-next-page"}
        ]}
    ]
});