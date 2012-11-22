enyo.kind({
    name: "Notifications",
    kind: "FittableRows",
    events: {
        onNotificationSelected: "",
        onBack: ""
    },
    meta: {
        limit: 20,
        offset: 0,
        total_count: 0
    },
    load: function() {
        chuisy.notification.list([], enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.items = response.objects;
            this.refresh();
        }), {limit: this.meta.limit});
    },
    nextPage: function() {
        var params = {
            limit: this.meta.limit,
            offset: this.meta.offset + this.meta.limit
        };
        chuisy.notification.list(this.filters, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.items = this.items.concat(response.objects);
            this.refresh();
        }), params);
    },
    refresh: function() {
        this.$.list.setCount(this.items.length);
        this.$.list.refresh();
    },
    allPagesLoaded: function() {
        return this.meta.offset + this.meta.limit >= this.meta.total_count;
    },
    setupItem: function(sender, event) {
        var item = this.items[event.index];

        switch (item.action) {
            case "like":
                this.$.image.setSrc(item.actor.profile.avatar_thumbnail);
                this.$.text.setContent("<strong>" + item.actor.first_name + "</strong> has <strong>liked</strong> a <strong>chu</strong> of yours.");
                break;
            case "comment":
                this.$.image.setSrc(item.actor.profile.avatar_thumbnail);
                this.$.text.setContent("<strong>" + item.actor.first_name + "</strong> has <strong>commented</strong> on a <strong>chu</strong> of yours.");
                break;
        }

        var isLastItem = event.index == this.items.length-1;
        if (isLastItem && !this.allPagesLoaded()) {
            this.$.loadingNextPage.show();
            this.nextPage();
        } else {
            this.$.loadingNextPage.hide();
        }

        return true;
    },
    notificationTapped: function(sender, event) {
        var not = this.items[event.index];
        this.doNotificationSelected({notification: not});
    },
    signedIn: function() {
        if (App.isOnline()) {
            this.load();
        }
    },
    signedOut: function() {
        this.items = [];
        this.refresh();
    },
    online: function() {
        if (chuisy.getSignInStatus().signedIn) {
            this.load();
        }
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back", name: "backButton"},
            {classes: "mainheader-text", content: "Notifications"},
            {kind: "onyx.Button", classes: "notification-button", ontap: "doShowNotifications", components: [
                {classes: "notification-button-icon"},
                {classes: "notification-button-badge", name: "noficationBadge", content: "3"}
            ]}
        ]},
        {kind: "List", name: "list", onSetupItem: "setupItem", rowsPerPage: 20, classes: "enyo-fill", fit: true, components: [
            {classes: "notifications-notification", ontap: "notificationTapped", components: [
                {kind: "Image", classes: "notifications-notification-image", name: "image"},
                {classes: "notifications-notification-text", name: "text", allowHtml: true}
            ]},
            {name: "loadingNextPage", content: "Loading...", classes: "notifications-nextpage"}
        ]},
        {kind: "Signals", onSignInSuccess: "signedIn", onSignOut: "signedOut", ononline: "online"}
    ]
});