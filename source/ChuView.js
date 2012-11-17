enyo.kind({
    name: "ChuView",
    classes: "chuview",
    kind: "FittableRows",
    published: {
        chu: null,
        liked: false
    },
    events: {
        onBack: ""
    },
    currencies: {
        "USD": "$",
        "EUR": "€",
        "GBP": "£"
    },
    chuChanged: function() {
        if (this.chu) {
            this.chu.likes = this.chu.likes || [];
            this.chu.comments = this.chu.comments || [];
            this.$.image.setSrc(this.chu.localImage || this.chu.image);
            this.$.avatar.setSrc(this.chu.user.profile.avatar_thumbnail);
            this.$.username.setContent(this.chu.user.username);
            this.$.price.setContent(this.currencies[this.chu.product.price_currency] + this.chu.product.price);
            this.$.locationText.setContent(this.chu.location && this.chu.location.place ? this.chu.location.place.name + ", " + this.chu.location.place.address : "");
            this.$.headerText.setContent("#" + this.chu.id);

            if (this.chu.liked) {
                this.setLiked(true);
                this.likeId = this.chu.liked;
            } else {
                this.setLiked(false);
            }

            this.$.likeCount.setContent(this.chu.likes.length + " likes");
            this.refreshLikerRepeater();

            this.refreshComments();
            
            this.addRemoveClass("owned", this.isOwned());
        }
    },
    userChanged: function(sender, event) {
        this.user = event.user;
        this.addRemoveClass("owned", this.isOwned());
    },
    isOwned: function() {
        return this.user && this.chu && this.user.id == this.chu.user.id;
    },
    likedChanged: function() {
        this.addRemoveClass("liked", this.liked);
        this.$.likeButton.addRemoveClass("active", this.liked);
    },
    toggleLike: function(sender, event) {
        this.$.likeButton.setDisabled(true);
        if (this.liked) {
            chuisy.like.remove(this.likeId, enyo.bind(this, function(sender, response) {
                // this.setLiked(false);
                this.chu.liked = false;
                // Remove this user's like from the likes array.
                for (var i=0; i<this.chu.likes.length; i++) {
                    if (this.chu.likes[i].user.id == this.user.id) {
                        this.chu.likes.remove(i);
                        break;
                    }
                }
                this.chuChanged();
                this.$.likeButton.setDisabled(false);
            }));
        } else {
            var likeData = {
                chu: this.chu.resource_uri
            };
            chuisy.like.create(likeData, enyo.bind(this, function(sender, response) {
                this.chu.liked = response.id;
                this.chu.likes.push(response);
                this.chuChanged();
                this.$.likeButton.setDisabled(false);
            }));
        }
        return true;
    },
    refreshLikerRepeater: function() {
        this.$.likerRepeater.setCount(Math.min(this.chu.likes.length, 10));
    },
    setupLiker: function(sender, event) {
        var user = this.chu.likes[event.index].user;
        event.item.$.likerImage.setSrc(user.profile.avatar_thumbnail);
    },
    refreshComments: function() {
        this.$.commentsRepeater.setCount(this.chu.comments ? this.chu.comments.length : 0);
        this.$.commentsRepeater.render();
    },
    setupComment: function(sender, event) {
        var comment = this.chu.comments[event.index];
        this.$.commentText.setContent(comment.text);
        this.$.commentAvatar.setSrc(comment.user.profile.avatar_thumbnail);
    },
    commentInputKeydown: function(sender, event) {
        if (event.keyCode == 13) {
            this.commentEnter();
        }
    },
    commentEnter: function() {
        var comment = {
            text: this.$.commentInput.getValue(),
            chu: this.chu.resource_uri,
            user: this.user
        };
        this.chu.comments.push(comment);
        var params = enyo.clone(comment);
        delete params.user;
        chuisy.chucomment.create(params, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
        this.refreshComments();
        this.$.commentInput.setValue("");
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
            {classes: "mainheader-text", content: "chuisy", name: "headerText"}
        ]},
        {kind: "Scroller", fit: true, components: [
            {kind: "Image", name: "image", classes: "chuview-productimage"},
            {components: [
                {kind: "Image", name: "avatar", classes: "miniavatar"},
                {classes: "chuview-username ellipsis", name: "username"}
            ]},
            {classes: "chuview-likes", components: [
                {name: "likeCount"},
                {kind: "Repeater", name: "likerRepeater", classes: "chuview-likerrepeater", onSetupItem: "setupLiker", components: [
                    {kind: "Image", name: "likerImage", classes: "miniavatar"}
                ]},
                {kind: "onyx.Button", name: "likeButton", content: "Like", ontap: "toggleLike"}
            ]},
            {classes: "chuview-price", name: "price"},
            {classes: "chuview-location", name: "locationText"},
            {kind: "Scroller", classes: "chuview-comments-scroller", components: [
                {kind: "FlyweightRepeater", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                    {kind: "onyx.Item", classes: "chuview-comment", components: [
                        {kind: "Image", name: "commentAvatar", classes: "miniavatar chuview-comment-avatar"},
                        {name: "commentText", classes: "chuview-comment-text"}
                    ]}
                ]}
            ]},
            {kind: "onyx.InputDecorator", classes: "chuview-commentinput-decorator", components: [
                {kind: "onyx.TextArea", name: "commentInput", placeholder: "Enter comment...", onkeydown: "commentInputKeydown"}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged"}
    ]
});