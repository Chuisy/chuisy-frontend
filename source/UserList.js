enyo.kind({
    name: "UserList",
    events: {
        onShowUser: ""
    },
    published: {
        users: null,
        rowsPerPage: 20,
        scrollerOffset: 0
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
        this.refresh(null, null, null, true);
        this.listenTo(this.users, "sync", this.refresh);
        if (!this.users.meta.total_count) {
            this.$.nextPageSpinner.addClass("rise");
            this.users.fetch({success: enyo.bind(this, function() {
                this.$.nextPageSpinner.removeClass("rise");
            })});
        }
    },
    rowsPerPageChanged: function() {
        this.$.userList.setRowsPerPage(this.rowsPerPage);
    },
    scrollerOffsetChanged: function() {
        this.$.userList.getStrategy().topBoundary = -this.scrollerOffset;
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
            this.$.nextPageSpacer.show();
            this.nextPage();
        } else {
            this.$.nextPageSpacer.hide();
        }

        return true;
    },
    nextPage: function() {
        this.$.nextPageSpinner.addClass("rise");
        this.users.fetchNext({success: enyo.bind(this, function() {
            this.$.nextPageSpinner.removeClass("rise");
        })});
    },
    userTap: function(sender, event) {
        this.doShowUser({user: this.users.at(event.index)});
        event.preventDefault();
    },
    refresh: function(coll, response, request, forceReset) {
        this.$.userList.setCount(this.users.length);
        if (!forceReset && this.users && this.users.meta && this.users.meta.offset) {
            this.$.userList.refresh();
        } else {
            this.$.userList.reset();
            this.$.userList.setScrollTop(-this.scrollerOffset);
        }
    },
    toggleFollow: function(sender, event) {
        var user = this.users.at(event.index);
        user.toggleFollow();
        this.refresh();
        App.sendCubeEvent(user.get("following") ? "follow" : "unfollow", {
            target_user: user,
            context: "list"
        });
        return true;
    },
    unfreeze: function() {
        this.$.userList.updateMetrics();
        this.$.userList.refresh();
    },
    components: [
        {kind: "Spinner", name: "nextPageSpinner", classes: "next-page-spinner"},
        {kind: "List", classes: "enyo-fill", name: "userList", onSetupItem: "setupUser", strategyKind: "TransitionScrollStrategy",
            thumb: false, rowsPerPage: 20, preventDragPropagation: false, components: [
            {kind: "UserListItem", ontap: "userTap", onToggleFollow: "toggleFollow"},
            {name: "nextPageSpacer", classes: "next-page-spacer"}
        ]}
    ]
});