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
        this.$.userListItem.update();

        var isLastItem = event.index == this.users.length-1;
        var hasNextPage = this.users.hasNextPage();
        this.$.listItem.addRemoveClass("next-page", isLastItem && hasNextPage);
        if (isLastItem && hasNextPage) {
            this.nextPage();
        }

        return true;
    },
    nextPage: function() {
        this.users.fetchNext();
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
        this.$.userList.renderRow(event.index);
        App.sendCubeEvent("action", {
            type: "follow",
            result: user.get("following") ? "follow" : "unfollow",
            target_user: user,
            context: "list"
        });
        return true;
    },
    components: [
        {kind: "List", classes: "enyo-fill", name: "userList", onSetupItem: "setupUser", strategyKind: "TransitionScrollStrategy",
            thumb: false, rowsPerPage: 20, preventDragPropagation: false, components: [
            {name: "listItem", classes: "list-item-wrapper", attributes: {"data-next-page": $L("Wait, there's more!")}, components: [
                {kind: "UserListItem", ontap: "userTap", onToggleFollow: "toggleFollow"}
            ]}
        ]}
    ]
});