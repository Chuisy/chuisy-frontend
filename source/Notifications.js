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
    // Meta data for loading notifications from the api
    meta: {
        limit: 20,
        offset: 0,
        total_count: 0
    },
    /**
        Load first batch of notifications
    */
    load: function() {
        chuisy.notification.list([], enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.items = response.objects;
            this.refresh();
            this.notificationsUpdated();
        }), {limit: this.meta.limit});
    },
    /**
        Loads next page of notifications
    */
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
    /**
        Refreshes notification list with loaded items
    */
    refresh: function() {
        this.$.list.setCount(this.items.length);
        this.$.list.refresh();
    },
    /**
        Checks if all notifications have been loaded
    */
    allPagesLoaded: function() {
        return this.meta.offset + this.meta.limit >= this.meta.total_count;
    },
    setupItem: function(sender, event) {
        var item = this.items[event.index];

        switch (item.action) {
            case "like":
                this.$.image.setSrc(item.actor.profile.avatar_thumbnail);
                this.$.text.setContent("<strong>" + item.actor.first_name + "</strong> has <strong>liked</strong> a <strong>chu</strong> you are subscribed to.");
                break;
            case "comment":
                this.$.image.setSrc(item.actor.profile.avatar_thumbnail);
                this.$.text.setContent("<strong>" + item.actor.first_name + "</strong> has <strong>commented</strong> on a <strong>chu</strong> you are subscribed to.");
                break;
            case "follow":
                this.$.image.setSrc(item.actor.profile.avatar_thumbnail);
                this.$.text.setContent("<strong>" + item.actor.first_name + "</strong> is now <strong>following</strong> you.");
                break;
        }
        this.$.notification.addRemoveClass("unread", !item.read);

        var isLastItem = event.index == this.items.length-1;
        if (isLastItem && !this.allPagesLoaded()) {
            // Last item in the list and there is more! Load next page
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
        if (!not.read) {
            // Mark notification as read
            not.read = true;
            params = enyo.clone(not);
            // Have to delete user because otherwise api will not return 200
            delete params.user;
            params.actor = params.actor.resource_uri;
            chuisy.notification.put(not.id, params, enyo.bind(this, function(sender, response) {
                this.refresh();
            }));
        }
    },
    /**
        Start polling regularly for new notifications
    */
    startPolling: function() {
        this.stopPolling();
        this.pollInterval = setInterval(enyo.bind(this, this.load), 60000);
    },
    /**
        Stop polling for notifications
    */
    stopPolling: function() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    },
    signedIn: function() {
        if (App.isOnline()) {
            this.load();
            this.startPolling();
        }
    },
    signedOut: function() {
        this.items = [];
        this.refresh();
        this.stopPolling();
    },
    online: function() {
        if (chuisy.getSignInStatus().signedIn) {
            this.load();
            this.startPolling();
        }
    },
    offline: function() {
        this.stopPolling();
    },
    pushNotification: function() {
        this.load();
        return true;
    },
    /**
        Mark all notifications as seen
    */
    seen: function() {
        if (this.items && this.items.length) {
            chuisy.notification.seen({latest: this.items[0].time}, enyo.bind(this, function(sender, response) {
                this.meta.unseen_count = response.unseen;
                this.notificationsUpdated();
            }));
        }
    },
    /**
        Fires _onNotificationsUpdated_ event and set the application icon badge number
    */
    notificationsUpdated: function() {
        enyo.Signals.send("onNotificationsUpdated", {total_count: this.meta.total_count, unread_count: this.meta.unread_count, unseen_count: this.meta.unseen_count});
        if (App.isMobile()) {
            window.plugins.pushNotification.setApplicationIconBadgeNumber(this.meta.unseen_count, function() {});
        }
    },
    components: [
        {kind: "List", name: "list", onSetupItem: "setupItem", rowsPerPage: 20, classes: "enyo-fill", components: [
            {classes: "notifications-notification", name: "notification", ontap: "notificationTapped", components: [
                {kind: "Image", classes: "notifications-notification-image", name: "image"},
                {classes: "notifications-notification-text", name: "text", allowHtml: true}
            ]},
            {name: "loadingNextPage", content: "Loading...", classes: "loading-next-page"}
        ]},
        {kind: "Signals", onSignInSuccess: "signedIn", onSignOut: "signedOut", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
    ]
});