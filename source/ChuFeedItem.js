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
            this.$.image.setSrc(this.chu.get("thumbnails") && this.chu.get("thumbnails")["300x300"] || this.chu.get("localImage") || "assets/images/chu_placeholder.png");
            this.$.avatar.setSrc(this.chu.get("user").profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
            this.$.fullName.setContent(this.chu.get("user").first_name + " " + this.chu.get("user").last_name);
            this.$.time.setContent(this.chu.getTimeText());
            this.$.likesCount.setContent(this.chu.get("likes_count"));
            this.$.commentsCount.setContent(this.chu.get("comments_count"));
            var location = this.chu.get("location");
            this.$.place.setContent(location && location.place ? location.place.name : "");
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