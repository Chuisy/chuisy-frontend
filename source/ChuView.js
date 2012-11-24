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

            this.likes = [];
            this.comments = [];
            this.refreshLikes();
            this.refreshComments();

            if (App.isOnline()) {
                this.loadLikes();
                this.loadComments();
            }
            
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
    likeButtonTapped: function() {
        if (chuisy.getSignInStatus().signedIn) {
            this.toggleLike();
        } else {
            enyo.Signals.send("onRequestSignIn", {
                success: enyo.bind(this, this.toggleLike)
            });
        }
    },
    toggleLike: function(sender, event) {
        this.$.likeButton.setDisabled(true);
        if (this.liked) {
            chuisy.like.remove(this.likeId, enyo.bind(this, function(sender, response) {
                this.setLiked(false);
                // Remove this user's like from the likes array.
                this.loadLikes();
                this.$.likeButton.setDisabled(false);
            }));
        } else {
            var params = {
                chu: this.chu.resource_uri
            };
            chuisy.like.create(params, enyo.bind(this, function(sender, response) {
                this.setLiked(response.id);
                this.loadLikes();
                this.$.likeButton.setDisabled(false);
            }));
        }
        return true;
    },
    loadLikes: function() {
        chuisy.like.list([["chu", this.chu.id]], enyo.bind(this, function(sender, response) {
            this.likes = response.objects;
            this.refreshLikes();
        }));
    },
    refreshLikes: function() {
        this.$.likeCount.setContent(this.likes.length);
        this.$.likerRepeater.setCount(Math.min(this.likes.length, 10));
    },
    setupLiker: function(sender, event) {
        var user = this.likes[event.index].user;
        event.item.$.likerImage.setSrc(user.profile.avatar_thumbnail);
    },
    loadComments: function() {
        chuisy.chucomment.list([["chu", this.chu.id]], enyo.bind(this, function(sender, response) {
            this.comments = response.objects;
            this.refreshComments();
        }));
    },
    refreshComments: function() {
        this.$.commentsRepeater.setCount(this.comments.length);
        this.$.commentsRepeater.render();
    },
    setupComment: function(sender, event) {
        var comment = this.comments[event.index];
        this.$.commentText.setContent(comment.text);
        this.$.commentAvatar.setSrc(comment.user.profile.avatar_thumbnail);
    },
    commentInputKeydown: function(sender, event) {
        if (event.keyCode == 13) {
            this.commentEnter();
        }
    },
    commentEnter: function() {
        if (chuisy.getSignInStatus().signedIn) {
            this.postComment();
        } else {
            enyo.Signals.send("onRequestSignIn", {
                success: enyo.bind(this, this.postComment)
            });
        }
    },
    postComment: function() {
        var params = {
            text: this.$.commentInput.getValue(),
            chu: this.chu.resource_uri
        };
        chuisy.chucomment.create(params, enyo.bind(this, function(sender, response) {
            this.loadComments();
        }));
        this.$.commentInput.setValue("");
    },
    online: function() {
        this.$.likeButton.setDisabled(false);
        this.$.commentInput.setDisabled(false);
        if (this.chu) {
            this.loadLikes();
            this.loadComments();
        }
    },
    offline: function() {
        this.$.likeButton.setDisabled(true);
        this.$.commentInput.setDisabled(true);
    },
    pushNotification: function() {
        this.loadComments();
        this.loadLikes();
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
                {kind: "onyx.Button", name: "likeButton", content: "Like", ontap: "likeButtonTapped"}
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
        {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
    ]
});