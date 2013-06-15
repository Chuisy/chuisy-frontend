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
    handlers: {
        onpostresize: "unfreeze"
    },
    create: function() {
        this.inherited(arguments);
        chuisy.notifications.on("reset", this.refresh, this);
        chuisy.notifications.on("request", this.showSpinner, this);
    },
    /**
        Refreshes notification list with loaded items
    */
    refresh: function() {
        this.$.list.setCount(chuisy.notifications.length);
        if (chuisy.notifications.meta && chuisy.notifications.meta.offset) {
            this.$.list.refresh();
        } else {
            this.$.list.reset();
        }
        this.$.placeholder.setShowing(!chuisy.notifications.length);
        this.hideSpinner();
    },
    showSpinner: function() {
        setTimeout(enyo.bind(this, function() {
            this.$.nextPageSpinner.addClass("rise");
        }), 500);
    },
    hideSpinner: function() {
        this.$.nextPageSpinner.removeClass("rise");
    },
    setupItem: function(sender, event) {
        var item = chuisy.notifications.at(event.index);
        var image = null;
        var subject = null;

        if (item.get("text")) {
            this.$.text.setContent(item.get("text"));
        } else {
            var connection = $L(" that you are interested in");
            var targetObj = item.get("target_obj");
            if (targetObj) {
                if (targetObj.owned) {
                    connection = $L(" of yours");
                } else if (targetObj.shared) {
                    connection = $L(" that was shared with you");
                } else if (targetObj.commented) {
                    connection = $L(" that you commented on");
                } else if (targetObj.liked) {
                    connection = $L(" that you liked");
                }
            }
            var time = item.getTimeText();
            switch (item.get("action")) {
                case "like":
                    this.$.text.setContent($L("<strong>{{ name }}</strong> has <strong>liked</strong> a <strong>Chu</strong>{{ connection }}.")
                        .replace("{{ name }}", item.get("actor").first_name)
                        .replace("{{ connection }}", connection));
                    break;
                case "comment":
                    this.$.text.setContent($L("<strong>{{ name }}</strong> has <strong>commented</strong> on a <strong>Chu</strong>{{ connection }}.")
                        .replace("{{ name }}", item.get("actor").first_name)
                        .replace("{{ connection }}", connection));
                    break;
                case "follow":
                    this.$.text.setContent($L("<strong>{{ name }}</strong> is now <strong>following</strong> you.")
                        .replace("{{ name }}", item.get("actor").first_name));
                    break;
                case "share":
                    this.$.text.setContent($L("<strong>{{ name }}</strong> has <strong>shared</strong> a <strong>Chu</strong> with you.")
                        .replace("{{ name }}", item.get("actor").first_name));
                    break;
                case "join":
                    this.$.text.setContent($L("<strong>{{ name }}</strong> has <strong>joined Chuisy</strong>!")
                        .replace("{{ name }}", item.get("actor").first_name));
                    break;
                case "goody":
                    this.$.text.setContent($L("You have <strong>received</strong> a new <strong>Goody</strong>!"));
                    image = chuisy.accounts.getActiveUser().profile.get("avatar_thumbnail");
                    break;
            }
            this.$.time.setContent(time);
        }

        this.$.image.applyStyle("background-image", "url(" + (image || item.get("thumbnail") || "") + ")");

        this.$.subject.applyStyle("background-image", "url(" + (item.get("subject_image") || "") + ")");
        this.$.subject.setShowing(item.get("subject_image"));

        this.$.notification.addRemoveClass("read", item.get("read"));

        var isLastItem = event.index == chuisy.notifications.length-1;
        if (isLastItem && chuisy.notifications.hasNextPage()) {
            // Last item in the list and there is more! Load next page
            this.$.nextPageSpacer.show();
            this.nextPage();
        } else {
            this.$.nextPageSpacer.hide();
        }

        return true;
    },
    nextPage: function() {
        chuisy.notifications.fetchNext({success: enyo.bind(this, function() {
            this.refresh();
        })});
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
    unfreeze: function() {
        this.$.list.updateMetrics();
        this.$.list.refresh();
    },
    components: [
        {kind: "Spinner", name: "nextPageSpinner", classes: "next-page-spinner rise"},
        // {classes: "placeholder", name: "placeholder", components: [
            {name: "placeholder", classes: "placeholder-image absolute-center"},
            // {classes: "placeholder-text", content: $L("Nothing new in here. Make something happen!")}
        // ]},
        {kind: "List", name: "list", onSetupItem: "setupItem", rowsPerPage: 40, classes: "enyo-fill",
            strategyKind: "TransitionScrollStrategy", thumb: false, components: [
            {classes: "list-item notifications-notification", name: "notification", ontap: "notificationTapped", components: [
                {classes: "notifications-notification-image", name: "image"},
                {classes: "notifications-notification-content", components: [
                    {classes: "notifications-notification-text", name: "text", allowHtml: true},
                    {classes: "notifications-notification-time", name: "time"}
                ]},
                {classes: "notifications-notification-subject", name: "subject"}
            ]},
            {name: "nextPageSpacer", classes: "next-page-spacer"}
        ]}
    ]
});