enyo.kind({
    name: "InviteFriends",
    kind: "FittableRows",
    classes: "invitefriends",
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    events: {
        onBack: ""
    },
    create: function() {
        this.inherited(arguments);
        this.userChanged();
        this.listenTo(chuisy.accounts, "change:active_user", this.userChanged);
        this.selectedFriends = {};
    },
    userChanged: function(sender, event) {
        this.user = chuisy.accounts.getActiveUser();

        if (this.user) {
            this.refreshList();
            this.stopListening();
            this.listenTo(this.user.fbFriends, "sync", this.refreshList);
            this.user.fbFriends.fetchAll();
        }
    },
    refreshList: function(model) {
        this.filteredFriends = this.user ? this.user.fbFriends.filter(enyo.bind(this, function(friend) {
            return friend.get("name").search(new RegExp(this.filterString, "i")) != -1;
        })) : [];
        this.$.list.setCount(this.filteredFriends.length);
        this.$.list.refresh();
    },
    setupItem: function(sender, event) {
        var friend = this.filteredFriends[event.index];
        this.$.avatar.setSrc(friend.getAvatar(32, 32));
        this.$.fullName.setContent(friend.get("name"));

        this.$.inviteButton.setShowing(!this.isSelected(friend));
        this.$.check.setShowing(this.isSelected(friend));
    },
    toggleFriend: function(sender, event) {
        var friend = this.filteredFriends[event.index];
        if (this.isSelected(friend)) {
            this.deselect(friend);
        } else {
            this.select(friend);
        }
        this.$.list.renderRow(event.index);
    },
    select: function(friend) {
        this.selectedFriends[friend.id] = friend;
    },
    deselect: function(friend) {
        delete this.selectedFriends[friend.id];
    },
    isSelected: function(friend) {
        return this.selectedFriends[friend.id];
    },
    invite: function() {
        var ids = _.pluck(this.selectedFriends, "id");
        FB.ui({
            method: 'apprequests',
            message: 'My Great Request',
            to: ids
        }, enyo.bind(this, function(response) {
            if (response.request) {
                // User did send the request
                this.doBack();
            }
        }));
    },
    applyFilter: function() {
        this.filterString = this.$.filterInput.getValue();
        this.refreshList();
    },
    filterCancel: function() {
        this.filterString = "";
        this.refreshList();
    },
    activate: function() {
        this.filterString = "";
        this.selectedFriends = {};
        this.refreshList();
    },
    deactivate: function() {
    },
    components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: $L("back")},
            {kind: "onyx.Button", ontap: "invite", classes: "done-button", content: $L("invite")}
        ]},
        {kind: "SearchInput", classes: "invitefriends-filter-input", placeholder: $L("Type to filter..."), onChange: "applyFilter", name: "filterInput", onCancel: "filterCancel"},
        {kind: "List", name: "list", fit: true, onSetupItem: "setupItem", rowsPerPage: 50, components: [
            {classes: "invitefriends-friend", components: [
                {kind: "Image", classes: "invitefriends-friend-avatar", name: "avatar"},
                {classes: "invitefriends-friend-fullname ellipsis", name: "fullName"},
                {classes: "invitefriends-friend-check", name: "check", showing: false, ontap: "toggleFriend"},
                {kind: "onyx.Button", content: $L("add"), ontap: "toggleFriend", name: "inviteButton", classes: "invitefriends-friend-invite-button"}
            ]}
        ]}
    ]
});