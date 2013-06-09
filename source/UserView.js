enyo.kind({
    name: "UserView",
    classes: "userview",
    kind: "FittableRows",
    published: {
        user: null
    },
    events: {
        onBack: ""
    },
    userChanged: function() {
        this.$.fullName.setContent(this.user.get("first_name") + " " + this.user.get("last_name"));
        this.$.avatarWindow.applyStyle("background-image", "url(" + this.user.profile.get("avatar") + ")");

        this.user.likedChus.fetch({data: {limit: 3, thumbnails: ["100x100"]}, success: enyo.bind(this, this.refreshHearts)});
        this.user.chus.fetch({data: {limit: 3, thumbnails: ["100x100"]}, success: enyo.bind(this, this.refreshChus)});
    },
    refreshHearts: function() {
        this.$.heartsRepeater.setCount(Math.min(this.user.likedChus.length, 3));
    },
    setupHeart: function(sender, event) {
        var heart = this.user && this.user.likedChus.at(event.index);
        event.item.$.image.setSrc(heart.get("thumbnails")["100x100"]);
    },
    refreshChus: function() {
        this.$.chusRepeater.setCount(Math.min(this.user.chus.length, 3));
    },
    setupChu: function(sender, event) {
        var chu = this.user && this.user.chus.at(event.index);
        event.item.$.image.setSrc(chu.get("thumbnails")["100x100"]);
    },
    activate: function(obj) {
        this.setUser(obj);
    },
    deactivate: function() {
    },
    components: [
        {classes: "header", components: [
            {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")}
        ]},
        {kind: "Scroller", fit: true, strategyKind: "TransitionScrollStrategy", components: [
            {classes: "userview-window", name: "avatarWindow", components: [
                {classes: "userview-fullname", name: "fullName"},
                {kind: "Button", name: "followButton", content: "follow", ontap: "followButtonTapped", classes: "userview-follow-button follow-button"}
            ]},
            {classes: "userview-tabs", components: [
                {kind: "Button", classes: "userview-tab", content: $L("Hearts")},
                {kind: "Button", classes: "userview-tab", content: $L("Chus")},
                {kind: "Button", classes: "userview-tab", content: $L("Followers")},
                {kind: "Button", classes: "userview-tab", content: $L("Following")}
            ]},
            {classes: "userview-box", components: [
                {kind: "Image", classes: "userview-box-label", src: "assets/images/hearts_placeholder.png"},
                {kind: "Repeater", style: "display: inline-block;", name: "heartsRepeater", onSetupItem: "setupHeart", components: [
                    {kind: "Image", classes: "userview-box-image"}
                ]}
            ]},
            {classes: "userview-box", components: [
                {kind: "Image", classes: "userview-box-label", src: "assets/images/closet_placeholder.png"},
                {kind: "Repeater", style: "display: inline-block;", name: "chusRepeater", onSetupItem: "setupChu", components: [
                    {kind: "Image", classes: "userview-box-image"}
                ]}
            ]}
        ]}
    ]
});