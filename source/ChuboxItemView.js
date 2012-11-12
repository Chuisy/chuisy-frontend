enyo.kind({
    name: "ChuboxItemView",
    classes: "chuboxitemview",
    kind: "FittableRows",
    published: {
        item: null,
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
    itemChanged: function() {
        if (this.item) {
            this.$.image.setSrc(this.item.image);
            this.$.avatar.setSrc(this.item.user.profile.avatar_thumbnail);
            this.$.username.setContent(this.item.user.username);
            this.$.price.setContent(this.currencies[this.item.product.price_currency] + this.item.product.price);
            this.$.locationText.setContent(this.item.location && this.item.location.place ? this.item.location.place.name + ", " + this.item.location.place.address : "");
            this.$.headerText.setContent("#" + this.item.id);

            if (this.item.liked) {
                this.setLiked(true);
                this.likeId = this.item.liked;
            } else {
                this.setLiked(false);
            }

            this.$.likeCount.setContent(this.item.likes.length + " likes");
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
        return this.user && this.item && this.user.id == this.item.user.id;
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
                this.item.liked = false;
                // Remove this user's like from the likes array.
                for (var i=0; i<this.item.likes.length; i++) {
                    if (this.item.likes[i].user.id == this.user.id) {
                        this.item.likes.remove(i);
                        break;
                    }
                }
                this.itemChanged();
                this.$.likeButton.setDisabled(false);
            }));
        } else {
            var likeData = {
                item: this.item.resource_uri
            };
            chuisy.like.create(likeData, enyo.bind(this, function(sender, response) {
                this.item.liked = response.id;
                this.item.likes.push(response);
                this.itemChanged();
                this.$.likeButton.setDisabled(false);
            }));
        }
        return true;
    },
    refreshLikerRepeater: function() {
        this.$.likerRepeater.setCount(Math.min(this.item.likes.length, 10));
    },
    setupLiker: function(sender, event) {
        var user = this.item.likes[event.index].user;
        event.item.$.likerImage.setSrc(user.profile.avatar_thumbnail);
    },
    refreshComments: function() {
        this.$.commentsRepeater.setCount(this.item ? this.item.comments.length : 0);
        this.$.commentsRepeater.render();
    },
    setupComment: function(sender, event) {
        var comment = this.item.comments[event.index];
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
            item: this.item.resource_uri,
            user: this.user
        };
        this.item.comments.push(comment);
        var params = enyo.clone(comment);
        delete params.user;
        chuisy.chuboxitemcomment.create(params, enyo.bind(this, function(sender, response) {
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
            {kind: "Image", name: "image", classes: "chuboxitemview-productimage"},
            {components: [
                {kind: "Image", name: "avatar", classes: "miniavatar"},
                {classes: "chuboxitemview-username ellipsis", name: "username"}
            ]},
            {classes: "chuboxitemview-likes", components: [
                {name: "likeCount"},
                {kind: "Repeater", name: "likerRepeater", classes: "chuboxitemview-likerrepeater", onSetupItem: "setupLiker", components: [
                    {kind: "Image", name: "likerImage", classes: "miniavatar"}
                ]},
                {kind: "onyx.Button", name: "likeButton", content: "Like", ontap: "toggleLike"}
            ]},
            {classes: "chuboxitemview-price", name: "price"},
            {classes: "chuboxitemview-location", name: "locationText"},
            {kind: "Scroller", classes: "chuboxitemview-comments-scroller", components: [
                {kind: "FlyweightRepeater", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                    {kind: "onyx.Item", classes: "chuboxitemview-comment", components: [
                        {kind: "Image", name: "commentAvatar", classes: "miniavatar chuboxitemview-comment-avatar"},
                        {name: "commentText", classes: "chuboxitemview-comment-text"}
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