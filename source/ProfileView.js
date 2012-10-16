enyo.kind({
    name: "ProfileView",
    kind: "FittableRows",
    classes: "profileview",
    published: {
        user: null, // Currently signed in user
        showedUser: null // User who's profile to show
    },
    events: {
        onChuSelected: "",
        onToggleMenu: ""
    },
    showedUserChanged: function() {
        if (this.showedUser) {
            this.$.avatar.setSrc(this.showedUser.profile.avatar);
            this.$.fullName.setContent(this.showedUser.first_name + " " + this.showedUser.last_name);
            this.$.userName.setContent(this.showedUser.username);
            this.$.bio.setContent(this.showedUser.profile.bio);
            this.loadChus();
        }
    },
    loadChus: function() {
        chuisy.chu.list([["user", this.showedUser.id]], enyo.bind(this, function(sender, response) {
            this.chus = response.objects;
            this.refreshChus();
        }));
    },
    refreshChus: function() {
        this.$.chuList.setCount(this.chus.length);
        this.$.chuList.render();
    },
    setupChu: function(sender, event) {
        var chu = this.chus[event.index];
        this.$.listChu.setChu(chu);
    },
    chuTapped: function(sender, event) {
        var chu = this.chus[event.index];
        this.doChuSelected({chu: chu});
    },
    components: [
        {kind: "FittableColumns", classes: "mainheader", content: "Chuisy", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {classes: "mainheader-text", content: "Profile"}
        ]},
        {kind: "Scroller", classes: "profileview-mainpanel", fit: true, components: [
            {classes: "main-content", components: [
                {classes: "pageheader", components: [
                    {kind: "Image", classes: "profileview-avatar", name: "avatar"},
                    {classes: "profileview-profileinfo", components: [
                        {classes: "profileview-fullname", name: "fullName"},
                        {classes: "profileview-username", name: "userName"},
                        {classes: "profileview-bio", name: "bio"}
                    ]}
                ]},
                {kind: "FlyweightRepeater", name: "chuList", onSetupItem: "setupChu", components: [
                    {kind: "ListChu", ontap: "chuTapped", style: "width: 100%;"}
                ]}
            ]}
        ]}
    ]
});