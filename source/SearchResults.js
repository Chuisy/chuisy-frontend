enyo.kind({
    name: "SearchResults",
    kind: "FittableRows",
    published: {
        users: [],
        chus: [],
        user: null
    },
    events: {
        onUserSelected: ""
    },
    usersChanged: function() {
        this.$.userList.setCount(this.users.length);
        this.$.userList.build();
    },
    setupUser: function(sender, event) {
        var user = this.users[event.index];
        event.item.$.userListItem.setUser(this.user);
        event.item.$.userListItem.setShowedUser(user);
        return true;
    },
    userTap: function(sender, event) {
        this.doUserSelected({user: this.users[event.index]});
    },
    components: [
        {kind: "RadioGroup", components: [
            {content: "Users"},
            {content: "Chus"}
        ]},
        {kind: "Panels", fit: true, name: "searchPanels", components: [
            {kind: "Scroller", components: [
                {kind: "Repeater", name: "userList", onSetupItem: "setupUser", components: [
                    {kind: "UserListItem", ontap: "userTap"}
                ]}
            ]}
        ]}
    ]
});