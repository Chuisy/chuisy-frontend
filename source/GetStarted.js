enyo.kind({
    name: "GetStarted",
    classes: "getstarted",
    events: {
        onDone: ""
    },
    create: function() {
        this.inherited(arguments);
        this.suggestedUsers = new chuisy.models.UserCollection([], {
            url: chuisy.models.UserCollection.prototype.url + "suggested/"
        });
        this.$.suggestedUsersList.setUsers(this.suggestedUsers);
    },
    activate: function() {
        var user = chuisy.accounts.getActiveUser();
        if (user) {
            user.fbFriends.fetchAll();
            this.$.suggestedUsersSpinner.show();
            this.suggestedUsers.fetch({data: {follow: true}, success: enyo.bind(this, function() {
                this.$.suggestedUsersSpinner.hide();
                this.$.suggestedUsersPanel.reflow();
                if (!this.suggestedUsers.length) {
                    this.suggestedUsersContinue();
                }
            }), error: enyo.bind(this, function() {
                this.suggestedUsersContinue();
            })});
        } else {
            this.doDone();
        }
    },
    deactivate: function() {
        this.$.panels.setIndex(0);
    },
    suggestedUsersContinue: function() {
        this.$.panels.setIndex(1);
        enyo.asyncMethod(this, function() {
            this.$.inviteFriendsPanel.reflow();
        });
    },
    inviteFriendsBack: function() {
        this.$.panels.setIndex(0);
    },
    inviteFriendsContinue: function() {
        var selectedFriends = this.$.fbFriendsPicker.getIds();
        if (selectedFriends.length) {
            FB.ui({
                method: "apprequests",
                message: $L("Come join me on Chuisy, help me decide on what to buy and share beautiful fashion you like!"),
                to: selectedFriends
            }, enyo.bind(this, function(response) {
                if (response.request) {
                    // User did send the request
                    this.doDone();
                }
            }));
        } else {
            this.doDone();
        }
    },
    components: [
        {kind: "Panels", arrangerKind: "CarouselArranger", draggable: false, classes: "enyo-fill", components: [
            {kind: "FittableRows", name: "suggestedUsersPanel", classes: "enyo-fill", components: [
                {classes: "header", components: [
                    {classes: "header-text getstarted-header-text", content: $L("Interesting People")},
                    {kind: "onyx.Button", ontap: "suggestedUsersContinue", classes: "done-button", content: $L("continue")}
                ]},
                {kind: "onyx.Spinner", classes: "getstarted-suggestedusers-spinner", name: "suggestedUsersSpinner"},
                {kind: "UserList", name: "suggestedUsersList", fit: true}
            ]},
            {kind: "FittableRows", name: "inviteFriendsPanel", classes: "enyo-fill", components: [
                {classes: "header", components: [
                    {classes: "header-text getstarted-header-text", content: $L("Invite Friends")},
                    // {kind: "onyx.Button", ontap: "inviteFriendsBack", classes: "back-button", content: $L("back")},
                    {kind: "onyx.Button", ontap: "inviteFriendsContinue", classes: "done-button", content: $L("done")}
                ]},
                {kind: "FbFriendsPicker", fit: true, buttonLabel: $L("invite")}
            ]}
        ]}
    ]
});