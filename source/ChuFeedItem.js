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
        onUserTapped: ""
    },
    chuChanged: function() {
        if (this.chu) {
            var user = this.chu.get("user");
            this.$.image.setSrc(this.chu.get("localImage") || this.chu.get("image") || "assets/images/chu_placeholder.png");
            this.$.avatar.setSrc(user && user.profile && user.profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
            this.$.fullName.setContent(user ? (user.first_name + " " + user.last_name) : $L("Not signed in..."));
            this.$.time.setContent(this.chu.getTimeText());
            this.$.likesCount.setContent(this.chu.get("likes_count"));
            this.$.commentsCount.setContent(this.chu.get("comments_count"));
            var location = this.chu.get("location");
            this.$.place.setContent(location && location.name || "");
            this.$.errorIcon.setShowing(this.chu.get("syncFailed") || this.chu.get("uploadFailed"));
        }
    },
    showUser: function() {
        this.doUserTapped();
        return true;
    },
    components: [
        {classes: "chufeeditem-error-icon", name: "errorIcon", ontap: "handleError"},
        {kind: "Image", name: "image", classes: "chufeeditem-image"},
        {classes: "chufeeditem-likes-comments", components: [
            {classes: "chufeeditem-likes-count", name: "likesCount"},
            {classes: "chufeeditem-likes-icon"},
            {classes: "chufeeditem-comments-count", name: "commentsCount"},
            {classes: "chufeeditem-comments-icon"}
        ]},
        {classes: "chufeeditem-place ellipsis", name: "place"},
        {kind: "Image", classes: "chufeeditem-avatar", name: "avatar", ontap: "showUser"},
        {classes: "chufeeditem-fullname ellipsis", name: "fullName", ontap: "showUser"},
        {classes: "chufeeditem-time", name: "time"}
    ]
});