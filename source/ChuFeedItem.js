/**
    _ChuFeedItem_ is used as an element in the chu feed.
*/
enyo.kind({
    name: "ChuFeedItem",
    classes: "chufeeditem",
    published: {
        //* Chu to display
        chu: null
    },
    events: {
        //* The chus avatar or name was tapped
        onUserTapped: "",
        onToggleLike: "",
        onStoreTapped: ""
    },
    update: function() {
        if (this.chu) {
            var user = this.chu.get("user");
            this.$.image.setSrc(this.chu.get("thumbnails") && this.chu.get("thumbnails")["292x292"] || this.chu.get("localImage") || "assets/images/chu_placeholder.png");
            this.$.avatar.setSrc(user && user.profile && user.profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
            this.$.fullName.setContent(user ? (user.first_name + " " + user.last_name) : $L("You (anonymous)"));
            var store = this.chu.get("store");
            this.$.store.setContent(store && store.name || "");
            this.$.heartButton.addRemoveClass("active", this.chu.get("liked"));
        }
    },
    userTapped: function() {
        this.doUserTapped();
        return true;
    },
    heartTapped: function(sender, event) {
        if (App.checkConnection()) {
            App.requireSignIn(enyo.bind(this, function() {
                var user = chuisy.accounts.getActiveUser();
                if (user && user.profile.get("fb_og_share_likes")) {
                    App.fbRequestPublishPermissions(null, enyo.bind(this, function() {
                        user.profile.set("fb_og_share_likes", false);
                        user.save();
                    }));
                }
                this.doToggleLike();
            }), "like");
        }
        return true;
    },
    storeTapped: function() {
        this.doStoreTapped();
        return true;
    },
    components: [
        // {classes: "chufeeditem-error-icon", name: "errorIcon", ontap: "handleError"},
        {classes: "chufeeditem-image-container", components: [
            {kind: "Image", name: "image", classes: "chufeeditem-image"}
        ]},
        // {classes: "chufeeditem-likes-comments-time", components: [
        //     {classes: "chufeeditem-likes-count", name: "likesCount"},
        //     {classes: "chufeeditem-likes-icon"},
        //     {classes: "chufeeditem-comments-count", name: "commentsCount"},
        //     {classes: "chufeeditem-comments-icon"},
        //     {classes: "chufeeditem-time ellipsis", name: "time"}
        // ]},
        {classes: "chufeeditem-bottom-bar", components: [
            {ontap: "userTapped", classes: "chufeeditem-user-button", components: [
                {kind: "Image", classes: "chufeeditem-avatar", name: "avatar"},
                {classes: "chufeeditem-fullname ellipsis", name: "fullName"},
                {classes: "chufeeditem-store ellipsis", name: "store"}
            ]},
            {classes: "chufeeditem-store-button", ontap: "storeTapped", components: [
                {classes: "chufeeditem-store-icon"}
            ]},
            {name: "heartButton", classes: "chufeeditem-heart-button", ontap: "heartTapped", components: [
                // {classes: "chufeeditem-heart-animated"},
                {classes: "chufeeditem-heart-icon"}
            ]}
        ]}
    ]
});