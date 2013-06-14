enyo.kind({
    name: "FbFriendsPicker",
    kind: "FittableRows",
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    published: {
        buttonLabel: $L("add")
    },
    handlers: {
        onpostresize: "unfreeze"
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
            this.reset();
            this.listenTo(this.user.fbFriends, "request", this.showSpinner);
            this.listenTo(this.user.fbFriends, "sync", this.refreshList);
        }
    },
    showSpinner: function() {
        this.$.spinner.show();
        this.reflow();
    },
    refreshList: function(model) {
        this.$.spinner.hide();
        this.reflow();
        this.filteredFriends = this.user ? this.user.fbFriends.filter(enyo.bind(this, function(friend) {
            return friend.get("name").search(new RegExp(this.filterString, "i")) != -1;
        })) : [];
        this.$.list.setCount(this.filteredFriends.length);
        this.$.list.refresh();
    },
    setupItem: function(sender, event) {
        var friend = this.filteredFriends[event.index];
        this.$.avatar.setSrc(friend.getAvatar(64, 64));
        this.$.fullName.setContent(friend.get("name"));

        this.$.addButton.setShowing(!this.isSelected(friend));
        this.$.addButton.setContent(this.buttonLabel);
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
    getIds: function() {
        return _.pluck(this.selectedFriends, "id");
    },
    applyFilter: function() {
        this.filterString = this.$.filterInput.getValue();
        this.refreshList();
    },
    filterCancel: function() {
        this.filterString = "";
        this.refreshList();
    },
    reset: function() {
        this.filterString = "";
        this.selectedFriends = {};
        this.refreshList();
    },
    unfreeze: function() {
        this.$.list.updateMetrics();
        this.$.list.refresh();
    },
    components: [
        {kind: "SearchInput", classes: "discover-searchinput", placeholder: $L("Type to filter..."), onChange: "applyFilter", name: "filterInput", onCancel: "filterCancel"},
        {kind: "Spinner", name: "spinner", classes: "fbfriendspicker-spinner", showing: false},
        {kind: "List", name: "list", fit: true, onSetupItem: "setupItem", rowsPerPage: 50,
            strategyKind: "TransitionScrollStrategy", thumb: false, components: [
            {classes: "fbfriendspicker-friend", components: [
                {kind: "Image", classes: "fbfriendspicker-friend-avatar", name: "avatar"},
                {classes: "fbfriendspicker-friend-fullname ellipsis", name: "fullName"},
                {classes: "fbfriendspicker-friend-check", name: "check", showing: false, ontap: "toggleFriend"},
                {kind: "Button", ontap: "toggleFriend", name: "addButton", classes: "fbfriendspicker-friend-add-button"}
            ]}
        ]}
    ]
});

enyo.kind({
    name: "InviteFriends",
    kind: "FittableRows",
    classes: "invitefriends",
    events: {
        onBack: ""
    },
    invite: function() {
        var ids = this.$.fbFriendsPicker.getIds();
        FB.ui({
            method: 'apprequests',
            message: $L("Come join me on Chuisy, help me decide on what to buy and share beautiful fashion you like!"),
            to: ids
        }, enyo.bind(this, function(response) {
            if (response.request) {
                chuisy.createInvites(response.request, ids);
                // User did send the request
                this.doBack();
                App.sendCubeEvent("fb_invite", {
                    ids: ids
                });
            } else {
                App.sendCubeEvent("fb_invite_cancel", {
                    ids: ids
                });
            }
        }));
    },
    activate: function() {
        this.$.fbFriendsPicker.reset();
        var user = chuisy.accounts.getActiveUser();
        if (user) {
            user.fbFriends.fetchAll();
        }
    },
    components: [
        {classes: "header", components: [
            {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")},
            {kind: "Button", ontap: "invite", classes: "header-button right", content: $L("invite")}
        ]},
        {kind: "FbFriendsPicker", fit: true}
    ]
});