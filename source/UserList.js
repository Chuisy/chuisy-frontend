enyo.kind({
    name: "UserList",
    events: {
        onShowUser: ""
    },
    published: {
        users: null,
        rowsPerPage: 20
    },
    handlers: {
        onpostresize: "unfreeze"
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        this.rowsPerPageChanged();
    },
    usersChanged: function() {
        this.stopListening();
        this.refresh();
        this.listenTo(this.users, "sync", this.refresh);
    },
    rowsPerPageChanged: function() {
        this.$.userList.setRowsPerPage(this.rowsPerPage);
    },
    setupUser: function(sender, event) {
        var user = this.users.at(event.index);
        this.$.userListItem.setUser(user);
        if (this.users.length == 1) {
            // Workaround for lists with a single items where userChanged does not seem to be called automatically.
            this.$.userListItem.userChanged();
        }

        var isLastItem = event.index == this.users.length-1;
        if (isLastItem && this.users.hasNextPage()) {
            // Item is last item in the list but there is more! Load next page.
            this.$.userNextPage.show();
            this.users.fetchNext();
        } else {
            this.$.userNextPage.hide();
        }

        return true;
    },
    userTap: function(sender, event) {
        this.doShowUser({user: this.users.at(event.index)});
        event.preventDefault();
    },
    refresh: function() {
        this.$.userList.setCount(this.users.length);
        this.$.userList.refresh();
    },
    toggleFollow: function(sender, event) {
        var user = this.users.at(event.index);
        user.toggleFollow();
        this.refresh();
        return true;
    },
    unfreeze: function() {
        this.$.userList.updateMetrics();
        this.$.userList.refresh();
    },
    components: [
        {kind: "List", classes: "enyo-fill", name: "userList", onSetupItem: "setupUser", strategyKind: "TransitionScrollStrategy", thumb: false, rowsPerPage: 20, components: [
            {kind: "UserListItem", ontap: "userTap", onToggleFollow: "toggleFollow"},
            {kind: "onyx.Spinner", name: "userNextPage", classes: "loading-next-page"}
        ]}
    ]
});