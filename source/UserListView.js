enyo.kind({
    name: "UserListView",
    kind: "FittableRows",
    events: {
        onBack: ""
    },
    published: {
        users: null,
        title: ""
    },
    usersChanged: function() {
        this.$.userList.setUsers(this.users);
    },
    titleChanged: function() {
        this.$.title.setContent(this.title);
    },
    activate: function() {
        this.$.userList.show();
        this.resized();
    },
    deactivate: function() {
        this.$.userList.hide();
    },
    components: [
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", name: "title"}
        ]},
        {kind: "UserList", fit: true}
    ]
});