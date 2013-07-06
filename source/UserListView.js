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
        if (!this.users.meta.total_count) {
            this.$.spinner.show();
            this.users.fetch({success: enyo.bind(this, function() {
                this.$.spinner.hide();
            })});
        }
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
        {kind: "Spinner", style: "position: absolute; left: 0; right: 0; top: 64px; margin: 0 auto;", showing: false},
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", name: "title"}
        ]},
        {kind: "UserList", fit: true}
    ]
});