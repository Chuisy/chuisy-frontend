/**
    Detail view for a Chu where users can like and comment. Includes an image view
    that allows zooming and scrolling
*/
enyo.kind({
    name: "ChuView",
    classes: "chuview",
    published: {
        //* Chu to display
        chu: null,
        //* Whether or not the current user has like this chu
        liked: false
    },
    events: {
        //* User has tapped the back button
        onBack: "",
        //* User has tapped the share button
        onShare: "",
        //* User has tapped the avatar or name of the chus author
        onShowUser: ""
    },
    handlers: {
        ontap: "tapHandler",
        onpostresize: "postResize"
    },
    currencies: {
        "USD": "$",
        "EUR": "€",
        "GBP": "£"
    },
    // Scroll buffer for parallax scrolling
    bufferHeight: 100,
    // Meta data for loading notifications from the api
    commentsMeta: {
        limit: 20,
        offset: 0,
        total_count: 0
    },
    chuChanged: function() {
        if (this.chu) {
            this.waiting = false;

            this.$.imageView.setSrc(this.chu.localImage || this.chu.image);
            this.$.avatar.setSrc(this.chu.user.profile.avatar_thumbnail || "");
            this.$.fullName.setContent(this.chu.user.first_name + " " + this.chu.user.last_name);
            this.$.categoryIcon.applyStyle("background-image", "url(assets/images/category_" + this.chu.product.category.name + "_48x48.png)");
            this.$.price.setContent(this.currencies[this.chu.product.price_currency] + this.chu.product.price);
            this.$.location.setContent(this.chu.location && this.chu.location.place ? this.chu.location.place.name : "");
            this.$.headerText.setContent("#" + this.chu.id);
            this.$.time.setContent(chuisy.timeToText(this.chu.time));

            this.addRemoveClass("owned", this.isOwned());

            if (this.chu.liked) {
                this.setLiked(true);
                // Store id of like object in case we need to delete it
                this.likeId = this.chu.liked;
            } else {
                this.setLiked(false);
            }

            this.likes = [];
            this.comments = [];
            this.refreshLikes();
            this.refreshComments();

            if (typeof(App) == "undefined" || App.isOnline() || this.chu.id) {
                this.loadLikes();
                this.loadComments();
            }

            if (this.hasNode()) {
                this.arrangeImage();
            }
        }
    },
    /**
        Configures the image view to the right zoom and scroll position to allow parallax scrolling
    */
    arrangeImage: function() {
        var bufferHeight = this.bufferHeight;
        var imageHeight = 1024;
        var imageWidth = 768;
        var screenHeight = this.$.imageView.getBounds().height;
        var screenWidth = this.$.imageView.getBounds().width;
        var scale = (screenHeight + 2 * bufferHeight) / imageHeight;
        this.$.imageView.setScale(scale);
        var scrollLeft = (this.$.imageView.getScrollBounds().width - this.$.imageView.getBounds().width) / 2;
        this.$.imageView.setScrollLeft(scrollLeft);
        this.scroll();
    },
    userChanged: function(sender, event) {
        this.user = event.user;
        this.addRemoveClass("owned", this.isOwned());
    },
    /**
        Checks if the current user ownes this chu
    */
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
            // User is not signed in yet. Prompt him to do so before he can like something
            enyo.Signals.send("onRequestSignIn", {
                success: enyo.bind(this, this.toggleLike)
            });
        }
        return true;
    },
    /**
        Like / unlike chu depending on current status
    */
    toggleLike: function(sender, event) {
        if (!this.waiting) {
            this.setLiked(!this.liked);
            // Setting waiting flag to make sure user doesn't trigger action while still waiting
            // for response from server
            this.waiting = true;
            if (!this.liked) {
                this.$.likesCount.setContent(this.likes.length - 1);
                chuisy.like.remove(this.likeId, enyo.bind(this, function(sender, response) {
                    this.loadLikes();
                    this.waiting = false;
                }));
            } else {
                this.$.likesCount.setContent(this.likes.length + 1);
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
    /**
        Load likes for this chu
    */
    loadLikes: function() {
        chuisy.like.list([["chu", this.chu.id]], enyo.bind(this, function(sender, response) {
            this.likes = response.objects;
            this.refreshLikes();
        }));
    },
    refreshLikes: function() {
        this.$.likesCount.setContent(this.likes.length);
    },
    setupLiker: function(sender, event) {
        var user = this.likes[event.index].user;
        event.item.$.likerImage.setSrc(user.profile.avatar_thumbnail);
    },
    /**
        Load comments for this chu
    */
    loadComments: function(callback) {
        chuisy.chucomment.list([["chu", this.chu.id]], enyo.bind(this, function(sender, response) {
            this.commentsMeta = response.meta;
            this.comments = response.objects;
            this.refreshComments();
            if (callback) {
                callback();
            }
        }), {limit: this.commentsMeta.limit});
    },
    /**
        Loads next page of notifications
    */
    nextCommentsPage: function() {
        var params = {
            limit: this.commentsMeta.limit,
            offset: this.commentsMeta.offset + this.commentsMeta.limit
        };
        chuisy.chucomment.list([["chu", this.chu.id]], enyo.bind(this, function(sender, response) {
            this.commentsMeta = response.meta;
            this.comments = this.comments.concat(response.objects);
            this.refreshComments();
        }), params);
    },
    refreshComments: function() {
        this.$.commentsCount.setContent(this.comments.length);
        this.$.commentsRepeater.setCount(this.comments.length);
        this.$.commentsRepeater.render();
    },
    /**
        Checks if all comments have been loaded
    */
    allPagesLoaded: function() {
        return this.commentsMeta.offset + this.commentsMeta.limit >= this.commentsMeta.total_count;
    },
    setupComment: function(sender, event) {
        var comment = this.comments[event.index];
        this.$.commentText.setContent(comment.text);
        this.$.commentAvatar.setSrc(comment.user.profile.avatar_thumbnail);
        this.$.commentFullName.setContent(comment.user.first_name + " " + comment.user.last_name);
        this.$.commentTime.setContent(chuisy.timeToText(comment.time));

        var isLastItem = event.index == this.comments.length-1;
        if (isLastItem && !this.allPagesLoaded()) {
            // Last item in the list and there is more! Load next page
            this.$.loadingNextPage.show();
            this.nextCommentsPage();
        } else {
            this.$.loadingNextPage.hide();
        }
    },
    commentInputKeydown: function(sender, event) {
        if (event.keyCode == 13) {
            // The enter key was pressed. Post the comment.
            this.commentEnter();
            event.preventDefault();
        }
    },
    commentEnter: function() {
        if (chuisy.getSignInStatus().signedIn) {
            this.postComment();
        } else {
            // User is not signed in yet. Prompt him to do so before he can comment
            enyo.Signals.send("onRequestSignIn", {
                success: enyo.bind(this, this.postComment)
            });
        }
    },
    /**
        Post a comment with the current input text
    */
    postComment: function() {
        var params = {
            text: this.$.commentInput.getValue(),
            chu: this.chu.resource_uri
        };
        chuisy.chucomment.create(params, enyo.bind(this, function(sender, response) {
            this.loadComments(enyo.bind(this, function() {
                // Scroll the comment input up. Align with top of screen if possible
                // this.$.commentsRepeater.prepareRow(0);
                // this.$.contentScroller.scrollIntoView(this.$.comment);
                // this.$.commentsRepeater.lockRow();
            }));
        }));
        this.$.commentInput.setValue("");

        // Remove focus from comment input
        this.$.commentInput.hasNode().blur();
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
        // Received a push notification. Let's see whats new.
        this.loadComments();
        this.loadLikes();
    },
    scroll: function() {
        // Apply parallax effect to image view
        var scrollTop = this.bufferHeight + this.$.contentScroller.getScrollTop()/10;
        if (scrollTop > 0 && scrollTop < 2 * this.bufferHeight) {
            this.$.imageView.setScrollTop(scrollTop);
        }
    },
    /**
        Hides the controls including the menu bar and zooms out to show full image
    */
    hideControls: function() {
        this.addClass("fullscreen");
        // Move image view to front after controls have faded out to allow interaction
        setTimeout(enyo.bind(this, function() {
            this.$.imageView.applyStyle("z-index", "1000");
        }), 500);
        this.$.imageView.smartZoom();
    },
    showControls: function() {
        // Move image view back under the other controls
        this.$.imageView.applyStyle("z-index", "0");
        this.removeClass("fullscreen");
        this.arrangeImage();
    },
    /**
        Open this chus share view
    */
    share: function() {
        this.doShare({chu: this.chu});
    },
    tapHandler: function(sender, event) {
        // Remove focus from comment input if the user taps outside of it
        if (!event.originator.isDescendantOf(this.$.commentInput)) {
            this.$.commentInput.hasNode().blur();
        }
    },
    /**
        Open this chus authors profile
    */
    showUser: function() {
        this.doShowUser({user: this.chu.user});
    },
    showCommentUser: function(sender, event) {
        var user = this.comments[event.index].user;
        this.doShowUser({user: user});
    },
    postResize: function() {
        this.$.contentScroller.applyStyle("height", (this.$.contentContainer.getBounds().height + 500) + "px");
        this.arrangeImage();
    },
    activate: function(obj) {
        this.setChu(obj);
        enyo.Signals.send("onShowGuide", {view: "chu"});
    },
    deactivate: function() {},
    components: [
        // IMAGEVIEW
        {kind: "ImageView", classes: "chuview-imageview enyo-fill", preventDragPropagation: true, onscroll: "imageScroll", src: "assets/images/chu_image_placeholder.png"},
        {classes: "chuview-cancel-fullscreen-button", ontap: "showControls"},
        // CONTROLS
        {kind: "FittableRows", name: "controls", classes: "chuview-controls enyo-fill", components: [
            // HEADER
            {classes: "header", components: [
                {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
                {classes: "header-text", content: "chuisy", name: "headerText", showing: false},
                {kind: "onyx.Button", classes: "share-button", ontap: "share", components: [
                    {classes: "share-button-icon"}
                ]}
            ]},
            {fit: true, name: "contentContainer", style: "position: relative; overflow: hidden;", components: [
                {kind: "Scroller", name: "contentScroller", touchOverscroll: true, onScroll: "scroll", components: [
                    // SPACER
                    {classes: "chuview-spacer", ontap: "hideControls"},
                    // LIKE BAR
                    {classes: "chuview-likebar", components: [
                        {classes: "chuview-like-button", name: "likeButton", ontap: "likeButtonTapped"}
                    ]},
                    {classes: "chuview-content", components: [
                        // CATEGORY, PRICE, COMMENTS, LIKES
                        {classes: "chuview-infobar", components: [
                            {classes: "chuview-category-icon", name: "categoryIcon"},
                            {classes: "chuview-price", name: "price"},
                            {classes: "chuview-likes-comments", components: [
                                {classes: "chuview-likes-count", name: "likesCount"},
                                {classes: "chuview-likes-icon"},
                                {classes: "chuview-comments-count", name: "commentsCount"},
                                {classes: "chuview-comments-icon"}
                            ]}
                        ]},
                        // AVATAR, NAME, TIME, LOCATION
                        {classes: "chuview-infobar", components: [
                            {classes: "chuview-location", name: "location"},
                            {kind: "Image", classes: "chuview-avatar", name: "avatar", ontap: "showUser"},
                            {classes: "chuview-fullname ellipsis", name: "fullName", ontap: "showUser"},
                            {classes: "chuview-time", name: "time"}
                        ]},
                        // COMMENT INPUT
                        {kind: "onyx.InputDecorator", classes: "chuview-commentinput-decorator", components: [
                            {kind: "onyx.TextArea", name: "commentInput", placeholder: "Enter comment...", onkeydown: "commentInputKeydown"}
                        ]},
                        // COMMENTS
                        {kind: "FlyweightRepeater", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                            {kind: "onyx.Item", classes: "chuview-comment", name: "comment", components: [
                                {classes: "chuview-infobar", components: [
                                    {kind: "Image", name: "commentAvatar", classes: "chuview-avatar", ontap: "showCommentUser"},
                                    {classes: "chuview-fullname", name: "commentFullName", ontap: "showCommentUser"},
                                    {classes: "chuview-time", name: "commentTime"}
                                ]},
                                {name: "commentText", classes: "chuview-comment-text"}
                            ]},
                            {name: "loadingNextPage", content: "Loading...", classes: "loading-next-page"}
                        ]},
                        {style: "height: 500px"}
                    ]}
                ]}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
    ]
});