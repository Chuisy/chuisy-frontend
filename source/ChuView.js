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
        onpostresize: "postResize",
        onload: "loaded"
    },
    currencies: {
        "USD": "$",
        "EUR": "€",
        "GBP": "£"
    },
    // Scroll buffer for parallax scrolling
    // bufferHeight: 100,
    scrollerOffset: -37,
    // Meta data for loading notifications from the api
    commentsMeta: {
        limit: 20,
        offset: 0,
        total_count: 0
    },
    // rendered: function() {
    //     this.inherited(arguments);
    //     var s = this.$.contentScroller.getStrategy().$.scrollMath;
    //     if (s) {
    //         s.kDragDamping = 0.3;
    //         s.kSnapFriction = 0.5;
    //     }
    // },
    twitterUrl: "http://twitter.com/share/",
    pinterestUrl: "http://pinterest.com/pin/create/button/",
    friends: [],
    loaded: function() {
        this.$.spinner.hide();
        this.arrangeImage();
    },
    chuChanged: function() {
        if (this.chu) {
            this.waiting = false;

            setTimeout(enyo.bind(this, function() {
                this.$.spinner.show();
            }), 10);
            this.$.imageView.setSrc(this.chu.localImage || this.chu.image || "assets/images/chu_placeholder.png");
            this.$.avatar.setSrc(this.chu.user && this.chu.user.profile.avatar_thumbnail ? this.chu.user.profile.avatar_thumbnail : "assets/images/avatar_thumbnail_placeholder.png");
            this.$.fullName.setContent(this.chu.user ? (this.chu.user.first_name + " " + this.chu.user.last_name) : "");
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

            this.adjustShareControls();
        }
    },
    /**
        Configures the image view to the right zoom and scroll position to allow parallax scrolling
    */
    arrangeImage: function() {
        // var bufferHeight = this.bufferHeight;
        // var imageHeight = 1024;
        // var imageWidth = 768;
        // var screenHeight = this.$.imageView.getBounds().height;
        // var screenWidth = this.$.imageView.getBounds().width;
        // var scale = (screenHeight + 2 * bufferHeight) / imageHeight;
        // this.$.imageView.setScale(scale);
        // var scrollLeft = (this.$.imageView.getScrollBounds().width - this.$.imageView.getBounds().width) / 2;
        // this.$.imageView.setScrollLeft(scrollLeft);
        // this.scroll();
        var s = this.$.imageView.getStrategy().$.scrollMath;
        s.kSpringDamping = 1;
        s.setScrollY(this.scrollerOffset);
        s.start();
    },
    userChanged: function(sender, event) {
        this.user = event.user;
        this.addRemoveClass("owned", this.isOwned());
        this.friends = [];
        this.loadFriends(0, 20);
    },
    /**
        Checks if the current user ownes this chu
    */
    isOwned: function() {
        return this.user && this.chu && (!this.chu.user || this.user.id == this.chu.user.id);
    },
    likedChanged: function() {
        this.addRemoveClass("liked", this.liked);
        this.$.likeButton.addRemoveClass("active", this.liked);
    },
    likeButtonTapped: function() {
        if (App.checkConnection()) {
            if (chuisy.getSignInStatus().signedIn) {
                this.toggleLike();
            } else {
                // User is not signed in yet. Prompt him to do so before he can like something
                enyo.Signals.send("onRequestSignIn", {
                    success: enyo.bind(this, this.toggleLike)
                });
            }
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
        this.$.commentAvatar.setSrc(comment.user.profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
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
    commentInputBlur: function() {
        if (!this.blurredByTap) {
            // The user has not dismissed the input by tapping outside it so he must have pressed
            // the done button on the virtual keyboard. We interpret this as wanting to send it.
            this.commentEnter();
        }
        this.blurredByTap = false;
    },
    commentEnter: function() {
        if (App.checkConnection()) {
            if (chuisy.getSignInStatus().signedIn) {
                this.postComment();
            } else {
                // User is not signed in yet. Prompt him to do so before he can comment
                enyo.Signals.send("onRequestSignIn", {
                    success: enyo.bind(this, this.postComment)
                });
            }
        }
    },
    /**
        Post a comment with the current input text
    */
    postComment: function() {
        if (this.$.commentInput.getValue()) {
            var comment = {
                text: this.$.commentInput.getValue(),
                chu: this.chu.resource_uri
            };
            chuisy.chucomment.create(comment, enyo.bind(this, function(sender, response) {
                this.loadComments(enyo.bind(this, function() {
                    // Scroll the comment input up. Align with top of screen if possible
                    // this.$.commentsRepeater.prepareRow(0);
                    // this.$.contentScroller.scrollIntoView(this.$.comment);
                    // this.$.commentsRepeater.lockRow();
                }));
            }));

            comment.user = this.user;
            this.comments = [comment].concat(this.comments);
            this.refreshComments();

            this.$.commentInput.setValue("");

            // Remove focus from comment input
            this.$.commentInput.hasNode().blur();
        }
    },
    online: function() {
        // this.$.likeButton.setDisabled(false);
        // this.$.commentInput.setDisabled(false);
        if (this.chu) {
            this.loadLikes();
            this.loadComments();
        }
    },
    offline: function() {
        // this.$.likeButton.setDisabled(true);
        // this.$.commentInput.setDisabled(true);
    },
    pushNotification: function() {
        // Received a push notification. Let's see whats new.
        this.loadComments();
        this.loadLikes();
    },
    scroll: function() {
        var s = this.$.imageView.getStrategy().$.scrollMath;
        s.setScrollY(this.scrollerOffset-this.$.contentScroller.getScrollTop()/3.5);
        s.scroll();
    },
    /**
        Hides the controls including the menu bar and zooms out to show full image
    */
    hideControls: function() {
        var s = this.$.imageView.getStrategy().$.scrollMath;
        s.kSpringDamping = 0.93;
        s.setScrollY(0);
        s.start();
        this.addClass("fullscreen");
        // Move image view to front after controls have faded out to allow interaction
        setTimeout(enyo.bind(this, function() {
            this.$.imageView.applyStyle("z-index", "1000");
        }), 500);
        // this.$.imageView.smartZoom();
    },
    showControls: function() {
        // Move image view back under the other controls
        this.$.imageView.applyStyle("z-index", "0");
        this.removeClass("fullscreen");
        this.$.imageView.setScale("auto");
        setTimeout(enyo.bind(this, function() {
            this.arrangeImage();
        }), 10);
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
            // We want to distinguish between the tapping the done button on the virtual keyboard
            // and tapping outside the input so we set this flag
            this.blurredByTap = true;
            this.$.commentInput.hasNode().blur();
        }
    },
    /**
        Open this chus authors profile
    */
    showUser: function() {
        if (App.checkConnection()) {
            this.doShowUser({user: this.chu.user});
        }
    },
    showCommentUser: function(sender, event) {
        if (App.checkConnection()) {
            var user = this.comments[event.index].user;
            this.doShowUser({user: user});
        }
    },
    postResize: function() {
        this.$.contentScroller.applyStyle("height", (this.$.contentContainer.getBounds().height + 500) + "px");
        this.arrangeImage();
    },
    toggleVisibility: function() {
        this.chu.visibility = this.chu.visibility == "public" ? "private" : "public";
        chuisy.closet.update(this.chu);
        this.adjustShareControls();
    },
    adjustShareControls: function() {
        this.$.visibilityButton.addRemoveClass("public", this.chu.visibility == "public");
        this.$.sharePanels.setIndex(this.chu.visibility == "public" ? 1 : 0);
        this.$.facebookButton.addRemoveClass("active", this.chu.fb_og);
    },
    getMessage: function() {
        if (this.chu.location && this.chu.location.place) {
            return $L("Check out this cool product I found at {{ place }}!").replace("{{ place }}", this.chu.location.place.name);
        } else {
            return $L("Check out this cool product!");
        }
    },
    checkSynced: function() {
        if (this.chu.synced) {
            return true;
        } else {
            navigator.notification.alert($L("You can't share this Chu yet because it is still being uploaded. Please try again in a couple of minutes!"), function() {}, $L("Hold your horses!"), $L("OK"));
            return false;
        }
    },
    /**
        Get the share url for the _chu_
    */
    getShareUrl: function() {
        var url = this.chu.url;
        if (this.chu.visibility == "private") {
            url += "?s=" + this.chu.secret;
        }
        return url;
    },
    /**
        Open twitter share dialog
    */
    twitter: function() {
        if (this.checkSynced()) {
            var text = this.getMessage();
            var url = this.getShareUrl();
            window.location = this.twitterUrl + "?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url) + "&via=Chuisy";
        }
    },
    /**
        Open pinterest share dialog
    */
    pinterest: function() {
        if (this.checkSynced()) {
            var url = this.getShareUrl();
            var media = this.chu.image;
            window.location = this.pinterestUrl + "?url=" + encodeURIComponent(url) + "&media=" + encodeURIComponent(media);
        }
    },
    /**
        Open sms composer with message / link
    */
    sms: function() {
        if (this.checkSynced()) {
            var message = this.getMessage();
            window.plugins.smsComposer.showSMSComposer(null, message + " " + this.getShareUrl());
        }
    },
    /**
        Open email composer with message / link
    */
    email: function() {
        if (this.checkSynced()) {
            var subject = $L("Hi there!");
            var message = this.getMessage();
            window.plugins.emailComposer.showEmailComposer(subject, message + " " + this.getShareUrl());
        }
    },
    /**
        Toggle if chu should be shared as open graph stories
    */
    toggleFacebook: function() {
        this.chu.fb_og = !this.chu.fb_og;
        this.$.facebookButton.addRemoveClass("active", this.chu.fb_og);
        chuisy.closet.update(this.chu);
    },
    /**
        Load the users friends and populate the people picker with the results
    */
    loadFriends: function(offset, limit) {
        chuisy.friends({offset: offset, limit: limit}, enyo.bind(this, function(sender, response) {
            this.friends = this.friends.concat(response.objects);
            this.$.peoplePicker.setItems(this.friends);
            if (response.meta && response.meta.next) {
                // Recursively load pages until all friends are loaded
                this.loadFriends(response.meta.offset + limit, limit);
            }
        }));
    },
    toggleFriends: function() {
        this.friendsSliderOpen = !this.friendsSliderOpen;
        if (this.friendsSliderOpen) {
            this.openFriends();
        } else {
            this.closeFriends();
        }
    },
    openFriends: function() {
        this.$.friendsButton.addClass("active");
        this.$.peoplePicker.setSelectedItems(this.chu.friends || []);
        this.$.friendsSlider.animateToMin();
    },
    closeFriends: function() {
        this.$.friendsButton.removeClass("active");
        this.$.friendsSlider.animateToMax();
        this.chu.friends = this.$.peoplePicker.getSelectedItems();
        if (this.friendsChanged) {
            chuisy.closet.update(this.chu);
            this.friendsChanged = false;
        }
    },
    friendsChangedHandler: function() {
        this.friendsChanged = true;
    },
    activate: function(obj) {
        this.setChu(obj);
        if (obj == this.chu) {
            // this.chuChanged (for some reason) not automatically called if the set object is identical to the previous one
            // So in that case we have to call it explicitly
            this.chuChanged();
        }
        this.friendsSliderOpen = false;
        this.$.friendsButton.removeClass("active");
        this.$.friendsSlider.setValue(100);
        enyo.Signals.send("onShowGuide", {view: "chu"});
    },
    deactivate: function() {
        this.blurredByTap = false;
        this.$.imageView.setSrc("assets/images/chu_image_placeholder.png");
        this.closeFriends();
    },
    components: [
        // IMAGE LOADING INDICATOR
        {kind: "onyx.Spinner", classes: "chuview-spinner spinner-dark"},
        // IMAGEVIEW
        {kind: "ImageView", classes: "chuview-imageview enyo-fill", preventDragPropagation: true, touchOverscroll: true,
            onscroll: "imageScroll", src: "assets/images/chu_image_placeholder.png"},
        {classes: "chuview-cancel-fullscreen-button", ontap: "showControls"},
        // CONTROLS
        {kind: "FittableRows", name: "controls", classes: "chuview-controls enyo-fill", components: [
            // HEADER
            {classes: "header", components: [
                {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: $L("back")},
                {classes: "chuview-share-controls", components: [
                    {kind: "Panels", name: "sharePanels", draggable: false, classes: "chuview-share-panels", arrangerKind: "CarouselArranger", components: [
                        {classes: "enyo-fill", components: [
                            {classes: "chuview-header-button messaging", ontap: "sms"},
                            {classes: "chuview-header-button friends", name: "friendsButton", ontap: "toggleFriends"}
                        ]},
                        {classes: "enyo-fill", components: [
                            {classes: "chuview-header-button messaging", ontap: "sms"},
                            {classes: "chuview-header-button facebook", name: "facebookButton", ontap: "toggleFacebook"},
                            {classes: "chuview-header-button twitter", ontap: "twitter"},
                            {classes: "chuview-header-button pinterest", ontap: "pinterest"}
                        ]}
                    ]},
                    {classes: "chuview-visibility", name: "visibilityButton", ontap: "toggleVisibility"}
                ]},
                {classes: "header-text", content: "chuisy", name: "headerText", showing: false},
                {kind: "onyx.Button", classes: "share-button", ontap: "share", showing: false, components: [
                    {classes: "share-button-icon"}
                ]}
            ]},
            {fit: true, name: "contentContainer", style: "position: relative; overflow: hidden;", components: [
                {kind: "Scroller", name: "contentScroller", touch: true, touchOverscroll: true, thumb: false, onScroll: "scroll", components: [
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
                            {kind: "onyx.TextArea", name: "commentInput", placeholder: $L("Enter comment..."), onkeydown: "commentInputKeydown", onblur: "commentInputBlur"}
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
                            {name: "loadingNextPage", content: $L("Loading..."), classes: "loading-next-page"}
                        ]},
                        {style: "height: 500px"}
                    ]}
                ]},
                {kind: "Slideable", name: "friendsSlider", unit: "%", min: 0, max: 100, value: 100, axis: "v", classes: "chuview-friends-slider", components: [
                    {kind: "PeoplePicker", classes: "enyo-fill", onChange: "friendsChangedHandler"}
                ]}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
    ]
});