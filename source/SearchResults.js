enyo.kind({
    name: "SearchResults",
    kind: "FittableRows",
    published: {
        users: [],
        chus: [],
        user: null
    },
    events: {
        onUserSelected: "",
        onChuSelected: ""
    },
    usersChanged: function() {
        if (this.users == "loading") {
            this.$.userList.setCount(0);
            this.$.userSpinner.show();
            this.$.userSpinner.start();
            this.$.userNoResults.hide();
        } else {
            this.$.userSpinner.hide();
            this.$.userSpinner.stop();
            this.$.userList.setCount(this.users.length);
            this.$.userNoResults.setShowing(!this.users.length);
        }
        this.$.userList.build();
    },
    chusChanged: function() {
        if (this.chus == "loading") {
            this.$.chuList.setCount(0);
            this.$.chuSpinner.show();
            this.$.chuSpinner.start();
            this.$.chuNoResults.hide();
        } else {
            this.$.chuSpinner.hide();
            this.$.chuSpinner.stop();
            this.$.chuList.setCount(this.chus.length);
            this.$.chuNoResults.setShowing(!this.chus.length);
        }
        this.$.chuList.build();
    },
    setupUser: function(sender, event) {
        var user = this.users[event.index];
        event.item.$.userListItem.setUser(user);
        return true;
    },
    setupChu: function(sender, event) {
        var chu = this.chus[event.index];
        event.item.$.chuAvatar.setSrc(chu.user.profile.avatar_thumbnail);
        event.item.$.chuCategory.setContent(chu.product.category.name);
        return true;
    },
    userTap: function(sender, event) {
        this.doUserSelected({user: this.users[event.index]});
    },
    chuTap: function(sender, event) {
        this.doChuSelected({chu: this.chus[event.index]});
    },
    radioGroupActivate: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.searchPanels.setIndex(event.originator.index);
        }
    },
    components: [
        {kind: "onyx.RadioGroup", onActivate: "radioGroupActivate", components: [
            {content: "Users", index: 0, active: true},
            {content: "Chus", index: 1}
        ]},
        {kind: "Panels", fit: true, name: "searchPanels", draggable: false, animate: false, components: [
            {kind: "Scroller", components: [
                {kind: "Repeater", name: "userList", onSetupItem: "setupUser", components: [
                    {kind: "UserListItem", ontap: "userTap"}
                ]},
                {kind: "onyx.Spinner", name: "userSpinner"},
                {name: "userNoResults", content: "No users found."}
            ]},
            {kind: "Scroller", components: [
                {kind: "Repeater", name: "chuList", onSetupItem: "setupChu", components: [
                    {kind: "onyx.Item", classes: "chulistitem", ontap: "chuTap", components: [
                        {kind: "Image", classes: "miniavatar", name: "chuAvatar"},
                        {classes: "chulistitem-title ellipsis", name: "chuCategory"}
                    ]}
                ]},
                {kind: "onyx.Spinner", name: "chuSpinner"},
                {name: "chuNoResults", content: "No chus found."}
            ]}
        ]}
    ]
});