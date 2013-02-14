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
    },
    userChanged: function(sender, event) {
        this.user = chuisy.accounts.getActiveUser();

        if (this.user) {
            this.refreshList();
            this.stopListening();
            this.listenTo(this.user.fbFriends, "sync", this.refreshList);
            this.user.fbFriends.fetch({data: {limit: 50}});
        }
    },
    refreshList: function(model) {
        if (this.user) {
            this.$.list.setCount(this.user.fbFriends.length);
            this.$.list.refresh();
        }
    },
    setupItem: function(sender, event) {
        var coll = this.user.fbFriends;
        var friend = coll.at(event.index);
        this.$.avatar.setSrc(friend.getAvatar(32, 32));
        this.$.fullName.setContent(friend.get("name"));

        this.$.inviteButton.setShowing(!this.$.list.isSelected(event.index));
        this.$.check.setShowing(this.$.list.isSelected(event.index));

        var isLastItem = event.index == coll.length-1;
        if (isLastItem && coll.hasNextPage()) {
            // We are at the end of the list and there seems to be more.
            // Load next bunch of chus
            coll.fetchNext();
            this.$.loadingNextPage.show();
        } else {
            this.$.loadingNextPage.hide();
        }
    },
    toggleFriend: function(sender, event) {
        this.$.list.select(event.index);
        this.$.list.renderRow(event.index);
    },
    activate: function() {
    },
    deactivate: function() {
    },
    components: [
        {classes: "header", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: $L("back")},
            {kind: "onyx.Button", ontap: "send", classes: "done-button", content: $L("invite")}
        ]},
        {kind: "List", name: "list", fit: true, onSetupItem: "setupItem", rowsPerPage: 50, multiSelect: true, toggleSelected: true, noSelect: true, components: [
            {classes: "invitefriends-friend", components: [
                {kind: "Image", classes: "invitefriends-friend-avatar", name: "avatar"},
                {classes: "invitefriends-friend-fullname ellipsis", name: "fullName"},
                {classes: "invitefriends-friend-check", name: "check", showing: false, ontap: "toggleFriend"},
                {kind: "onyx.Button", content: $L("add"), ontap: "toggleFriend", name: "inviteButton", classes: "invitefriends-friend-invite-button"}
            ]},
            {kind: "onyx.Spinner", classes: "invitefriends-next-spinner", name: "loadingNextPage"}
        ]}
    ]
});