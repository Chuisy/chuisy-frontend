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
            {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")},
            {classes: "header-text", name: "title"}
        ]},
        {kind: "UserList", fit: true}
    ]
});