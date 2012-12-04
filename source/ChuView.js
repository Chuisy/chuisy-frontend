enyo.kind({
    name: "ChuView",
    classes: "chuview",
    published: {
        chu: null,
        liked: false
    },
    events: {
        onBack: "",
        onShare: ""
    },
    currencies: {
        "USD": "$",
        "EUR": "€",
        "GBP": "£"
    },
    created: function() {
        this.inherited(arguments);
        this.chuChanged();
    },
    chuChanged: function() {
        if (this.chu) {
            this.$.imageView.setSrc(this.chu.localImage || this.chu.image);
            this.$.avatar.setSrc(this.chu.user.profile.avatar_thumbnail);
            this.$.fullName.setContent(this.chu.user.first_name + " " + this.chu.user.last_name);
            this.$.categoryIcon.applyStyle("background-image", "url(assets/images/category_" + this.chu.product.category + ".png)");
            this.$.price.setContent(this.currencies[this.chu.product.price_currency] + this.chu.product.price);
            this.$.location.setContent(this.chu.location && this.chu.location.place ? this.chu.location.place.name + ", " + this.chu.location.place.address : "");
            this.$.headerText.setContent("#" + this.chu.id);

            if (this.chu.liked) {
                this.setLiked(true);
                this.likeId = this.chu.liked;
            } else {
                this.setLiked(false);
            }

            // this.$.likeButton.setContent(this.chu.likes_count);

            this.likes = [];
            this.comments = [];
            this.refreshLikes();
            this.refreshComments();

            if (typeof(App) == "undefined" || App.isOnline() || this.chu.id) {
                this.loadLikes();
                this.loadComments();
            }
            
            this.addRemoveClass("owned", this.isOwned());

            // this.$.imageView.setScale("height");
            // this.$.scrollTopAnimator.play({
            //     startValue: 0,
            //     endValue: 100,
            //     duration: 10000
            // });
            // this.$.scrollLeftAnimator.play({
            //     startValue: 0,
            //     endValue: 100,
            //     duration: 10000
            // });
            // this.$.imageView.setScrollTop(100);
            // this.$.imageView.setScrollLeft(100);
            // this.$.scaleAnimator.play({
            //     startValue: 1,
            //     endValue: 1.1,
            //     duration: 5000
            // });
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
        // this.setLiked(!this.liked);
        return true;
    },
    toggleLike: function(sender, event) {
        if (!this.waiting) {
            this.setLiked(!this.liked);
            this.waiting = true;
            if (!this.liked) {
                this.$.likeButton.setContent(this.likes.length - 1);
                chuisy.like.remove(this.likeId, enyo.bind(this, function(sender, response) {
                    this.loadLikes();
                    this.waiting = false;
                }));
            } else {
                this.$.likeButton.setContent(this.likes.length + 1);
                var params = {
                    chu: this.chu.resource_uri
                };
                chuisy.like.create(params, enyo.bind(this, function(sender, response) {
                    this.likeId = response.id;
                    this.loadLikes();
                    this.waiting = false;
                }));
            }
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
        this.$.likeButton.setContent(this.likes.length);
        // this.$.likerRepeater.setCount(Math.min(this.likes.length, 10));
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
        this.$.commentFullName.setContent(comment.user.first_name + " " + comment.user.last_name);
        this.$.commentTime.setContent(chuisy.timeToText(comment.time));
    },
    commentInputKeydown: function(sender, event) {
        if (event.keyCode == 13) {
            this.commentEnter();
            event.preventDefault();
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
        // this.$.likeButton.setDisabled(false);
        this.$.commentInput.setDisabled(false);
        if (this.chu) {
            this.loadLikes();
            this.loadComments();
        }
    },
    offline: function() {
        // this.$.likeButton.setDisabled(true);
        this.$.commentInput.setDisabled(true);
    },
    pushNotification: function() {
        this.loadComments();
        this.loadLikes();
    },
    scaleStep: function() {
        this.$.imageView.setScale(this.$.scaleAnimator.value);
    },
    scrollTopStep: function() {
        this.$.imageView.setScrollTop(this.$.scrollTopAnimator.value);
    },
    scrollLeftStep: function() {
        this.$.imageView.setScrollLeft(this.$.scrollLeftAnimator.value);
    },
    scroll: function() {
        // if (this.$.contentScroller.getScrollTop() < -100) {
        //     this.$.contentSlideable.animateToMax();
        // }
        this.addRemoveClass("scrolled-up", this.$.contentScroller.getScrollTop() > 200);
        this.$.imageView.setScrollTop(100 + this.$.contentScroller.getScrollTop()/10);
        // this.log(this.$.contentScroller.getScrollTop());
    },
    hideControls: function() {
        this.addClass("fullscreen");
        setTimeout(enyo.bind(this, function() {
            this.$.imageView.applyStyle("z-index", "1000");
        }), 500);
    },
    showControls: function() {
        this.$.imageView.applyStyle("z-index", "0");
        this.removeClass("fullscreen");
    },
    share: function() {
        this.doShare({chu: this.chu});
    },
    components: [
        {kind: "ImageView", classes: "chuview-imageview enyo-fill", scale: "height"},
        {classes: "chuview-cancel-fullscreen-button", ontap: "showControls"},
        {kind: "FittableRows", name: "controls", classes: "chuview-controls enyo-fill", components: [
            {kind: "Slideable", classes: "chuview-commentinput-slider", unit: "%", min: 0, max: 100, value: 100, components: [
            ]},
            {classes: "mainheader", components: [
                {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
                {classes: "mainheader-text", content: "chuisy", name: "headerText"}
            ]},
            {fit: true, style: "position: relative;", components: [
                {classes: "chuview-category-icon", name: "categoryIcon"},
                {classes: "chuview-price", name: "price"},
                {kind: "Scroller", name: "contentScroller", touchOverscroll: true, classes: "enyo-fill", components: [
                    {classes: "chuview-spacer", ontap: "hideControls", components: [
                        {classes: "chuview-location", name: "location"},
                        {classes: "chuview-like-button", name: "likeButton", ontap: "likeButtonTapped"}
                    ]},
                    {classes: "chuview-content", components: [
                        {classes: "chuview-infobar", components: [
                            {kind: "Image", classes: "chuview-avatar", name: "avatar"},
                            {classes: "chuview-fullname ellipsis", name: "fullName"}
                        ]},
                        {kind: "onyx.InputDecorator", classes: "chuview-commentinput-decorator", components: [
                            {kind: "onyx.TextArea", name: "commentInput", placeholder: "Enter comment...", onkeydown: "commentInputKeydown"}
                        ]},
                        {kind: "FlyweightRepeater", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                            {kind: "onyx.Item", classes: "chuview-comment", components: [
                                {components: [
                                    {kind: "Image", name: "commentAvatar", classes: "chuview-comment-avatar"},
                                    {classes: "chuview-comment-fullname", name: "commentFullName"},
                                    {classes: "chuview-comment-time", name: "commentTime"}
                                ]},
                                {name: "commentText", classes: "chuview-comment-text"}
                            ]}
                        ]}
                    ]}
                ]}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"},
        {kind: "Animator", name: "scaleAnimator", onStep: "scaleStep", easingFunction: enyo.easing.linear},
        {kind: "Animator", name: "scrollTopAnimator", onStep: "scrollTopStep", easingFunction: enyo.easing.linear},
        {kind: "Animator", name: "scrollLeftAnimator", onStep: "scrollLeftStep", easingFunction: enyo.easing.linear}
    ]
});