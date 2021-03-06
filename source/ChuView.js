/**
    Detail view for a Chu where users can like and comment. Includes an image view
    that allows zooming and scrolling
*/
enyo.kind({
    name: "ChuView",
    classes: "chuview",
    published: {
        //* Chu to display
        chu: null
    },
    events: {
        //* User has tapped the back button
        onBack: "",
        //* User has tapped the share button
        onShowUser: "",
        onShowStore: "",
        onShowUserList: ""
    },
    handlers: {
        onpostresize: "postResize"
    },
    twitterUrl: "http://twitter.com/share/",
    pinterestUrl: "http://pinterest.com/pin/create/button/",
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        var s = this.$.contentScroller.getStrategy();
        s.scrollIntervalMS = 17;
        // s.maxScrollTop = -60;
    },
    imageLoaded: function() {
        this.$.spinner.hide();
        this.$.imageContainer.applyStyle("-webkit-animation", "none");
        enyo.asyncMethod(this, function() {
            this.$.imageContainer.applyStyle("-webkit-animation", "fadein 0.5s");
            this.$.image.applyStyle("opacity", 1);
            this.positionImage();
        });
    },
    chuChanged: function() {
        this.updateView();
        this.stopListening();
        if (this.chu.get("stub")) {
            this.chu.fetch({success: enyo.bind(this, function() {
                this.chu.set({"stub": false}, {silent: true});
            })});
        }
        this.listenTo(this.chu, "change", this.updateView);
        this.refreshComments();
        this.refreshLikes();
        this.listenTo(this.chu.comments, "sync", this.refreshComments);
        this.listenTo(this.chu.likes, "sync", this.refreshLikes);
        if (this.chu.get("url")) {
            this.loadComments();
            this.loadLikes();
        }
        this.listenTo(this.chu, "sync", this.chuChanged);
        enyo.asyncMethod(this, function() {
            this.$.contentScroller.scrollToTop();
        });
    },
    updateView: function() {
        var user = this.chu.get("user");
        var store = this.chu.get("store");

        var image = this.chu.get("localImage") || this.chu.get("image") || "";
        if (image != this.$.image.src) {
            this.$.spinner.show();
            // this.$.image.addClass("loading");
            this.$.image.applyStyle("opacity", 0);
            this.$.image.setSrc(image);
        }

        this.$.avatar.setSrc(user && user.profile && user.profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
        this.$.fullName.setContent(user ? (user.first_name + " " + user.last_name) : " ");
        this.$.store.setContent(store && store.name || "");

        var currFmt = new enyo.g11n.NumberFmt({style: "currency", fractionDigits: 0, currency: this.chu.get("price_currency"), locale: store && store.country && store.country.toLowerCase() || undefined});
        this.$.price.setContent(this.chu.get("price") ? currFmt.format(this.chu.get("price")) : "");

        var likesCount = this.chu.get("likes_count");
        var likesText = this.chu.get("likes_count") == 1 ? $L("1 person likes this") : $L("{{ count }} people like this").replace("{{ count }}", likesCount);
        this.$.likesText.setContent(likesText);
        this.$.likesContainer.setShowing(this.likesCount);

        this.$.likeButton.addRemoveClass("active", this.chu.get("liked"));

        this.$.shareControls.setShowing(this.chu.get("visibility") == "public");
        this.$.instagramButton.setShowing(false);
        if (Instagram) {
            Instagram.isInstalled(enyo.bind(this, function(err, installed) {
                this.$.instagramButton.setShowing(installed);
            }));
        }
    },
    /**
        Configures the image view to the right zoom and scroll position to allow parallax scrolling
    */
    positionImage: function() {
        this.$.imageContainer.applyStyle("-webkit-transform", "translate3d(0, " + -this.$.contentScroller.getScrollTop()/2 + "px, 0)");
    },
    /**
        Checks if the current user ownes this chu
    */
    isOwned: function() {
        var activeUser = chuisy.accounts.getActiveUser();
        var user = this.chu.get("user");
        return !activeUser && !user || activeUser && (!user || activeUser.id == user.id);
    },
    likeButtonTapped: function() {
        if (App.checkConnection()) {
            App.requireSignIn(enyo.bind(this, function() {
                var user = chuisy.accounts.getActiveUser();
                if (user && user.profile.get("fb_og_share_likes")) {
                    App.fbRequestPublishPermissions(null, enyo.bind(this, function() {
                        user.profile.set("fb_og_share_likes", false);
                        user.save();
                    }));
                }
                this.toggleLike();
            }), "like");
        }
        return true;
    },
    /**
        Like / unlike chu depending on current status
    */
    toggleLike: function() {
        if (this.checkSynced()) {
            this.chu.toggleLike();
            this.refreshLikes();
            if (this.chu.get("liked")) {
                this.$.heart.animate();
            }
            App.sendCubeEvent("action", {
                type: "like",
                result: this.chu.get("liked") ? "like" : "unlike",
                chu: this.chu,
                context: "chu_view"
            });
        }
    },
    refreshComments: function() {
        var totalCount = this.chu.comments.meta && this.chu.comments.total_count || this.chu.get("comments_count") || 0;
        this.$.commentsSpinner.hide();
        this.$.moreCommentsSpinner.hide();
        this.$.moreComments.setShowing(this.chu.comments.hasNextPage());
        this.$.moreComments.setContent($L("{{ count }} more comments...").replace("{count}", totalCount - this.chu.comments.length));
        // this.$.commentsCount.setContent(totalCount);
        this.$.commentsRepeater.setCount(this.chu.comments.length);
        this.$.commentsRepeater.render();
        this.$.commentsContainer.setShowing(this.chu.comments.length);
    },
    refreshLikes: function() {
        // this.$.likesSpinner.hide();
        this.$.likesRepeater.show();
        var max = 5;
        var count = this.chu.likes.meta && this.chu.likes.meta.total_count || this.chu.get("likes_count") || 0;
        count = Math.max(count, this.chu.likes.length);
        // this.$.likesCount.setContent(count);
        this.$.likesRepeater.setCount(Math.min(this.chu.likes.length, max));
        this.$.likesRepeater.render();
        this.$.likesContainer.setShowing(count);
    },
    loadComments: function() {
        this.$.moreComments.hide();
        this.$.commentsSpinner.show();
        this.$.commentsContainer.show();
        this.chu.comments.fetch({data: {limit: 5}});
    },
    loadLikes: function() {
        // this.$.likesSpinner.show();
        this.$.likesRepeater.hide();
        this.$.likesContainer.show();
        this.chu.likes.fetch({data: {limit: 10}});
    },
    setupComment: function(sender, event) {
        var comment = this.chu.comments.at(event.index);
        var user = comment.get("user");
        this.$.commentText.setContent(comment.get("text"));
        var avatar = user && user.profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png";
        this.$.commentAvatar.setSrc(avatar);
        this.$.commentFullName.setContent(user ? user.first_name + " " + user.last_name : $L("You (anonymous)"));
        this.$.commentTime.setContent(comment.getTimeText());
        // this.$.commentDeleteButton.setShowing(chuisy.accounts.getActiveUser() && (user.id == chuisy.accounts.getActiveUser().id));
    },
    setupLike: function(sender, event) {
        var user = this.chu.likes.at(event.index);
        event.item.$.likeImage.setSrc(user.profile.get("avatar_thumbnail") || user.profile.get("avatar") || "assets/images/avatar_thumbnail_placeholder.png");
    },
    commentInputKeydown: function(sender, event) {
        if (event.keyCode == 13) {
            // The enter key was pressed. Post the comment.
            this.commentEnter();
            event.preventDefault();
        }
    },
    commentEnter: function() {
        this.$.commentInput.hasNode().blur();
        if (App.checkConnection()) {
            App.requireSignIn(enyo.bind(this, this.postComment), "comment");
        }
        event.preventDefault();
        return true;
    },
    /**
        Post a comment with the current input text
    */
    postComment: function() {
        if (this.$.commentInput.getValue() && this.checkSynced()) {
            var attrs = {
                text: this.$.commentInput.getValue(),
                user: chuisy.accounts.getActiveUser().toJSON()
            };
            var comment = this.chu.comments.create(attrs);
            App.sendCubeEvent("action", {
                type: "comment",
                comment: comment
            });
            this.refreshComments();

            this.$.commentInput.setValue("");
            this.scrollToBottom();
        }
    },
    online: function() {
        if (this.chu) {
            this.loadComments();
        }
    },
    offline: function() {
    },
    pushNotification: function(sender, event) {
        // Received a push notification. Let's see whats new.
        if (this.chu && event.notification.uri == "chu/" + this.chu.id + "/") {
            navigator.notification.beep(1);
            navigator.notification.vibrate(1000);
            if (event.notification.action == "comment") {
                this.loadComments();
                setTimeout(enyo.bind(this, function() {
                    this.scrollToBottom();
                }), 100);
            }
            if (event.notification.action == "like") {
                this.loadLikes();
                setTimeout(enyo.bind(this, function() {
                    this.scrollToLikes();
                }), 100);
            }
        }
    },
    /**
        Open this chus authors profile
    */
    showUser: function() {
        var user = this.chu.get("user");
        this.doShowUser({user: user});
    },
    showCommentUser: function(sender, event) {
        this.doShowUser({user: this.chu.comments.at(event.index).get("user")});
    },
    showStore: function(sender, event) {
        this.doShowStore({store: this.chu.get("store")});
    },
    postResize: function() {
        this.$.contentScroller.applyStyle("height", (this.$.contentContainer.getBounds().height + 500) + "px");
        this.positionImage();
    },
    getMessage: function() {
        var store = this.chu.get("store");
        if (store && store.name) {
            return $L("Look what I found at {{ place }}! What do you think?").replace("{{ place }}", store.name);
        } else {
            return $L("Check out this cool fashion item!");
        }
    },
    checkSynced: function() {
        if (this.chu.get("url")) {
            return true;
        } else {
            navigator.notification.alert($L("Hold on, your Chu is still being uploaded. Please try again in a moment!"), function() {}, $L("Hold your horses!"), $L("OK"));
            return false;
        }
    },
    checkUploaded: function() {
        if (this.chu.get("image")) {
            return true;
        } else {
            navigator.notification.alert($L("Hold on, your Chu is still being uploaded. Please try again in a moment!"), function() {}, $L("Hold your horses!"), $L("OK"));
            return false;
        }
    },
    /**
        Get the share url for the _chu_
    */
    getShareUrl: function() {
        var url = this.chu.get("url");
        if (this.chu.get("visibility") == "private") {
            url += "?s=" + this.chu.get("secret");
        }
        return url;
    },
    facebook: function() {
        App.requireSignIn(enyo.bind(this, function() {
            if (App.checkConnection() && this.checkSynced() && this.checkUploaded()) {
                App.shareFacebook(this.getMessage(), this.getShareUrl(), this.chu.get("localImage"));
            }
        }), "share_facebook");
    },
    /**
        Open twitter share dialog
    */
    twitter: function() {
        App.requireSignIn(enyo.bind(this, function() {
            if (App.checkConnection() && this.checkSynced() && this.checkUploaded()) {
                App.shareTwitter(this.getMessage(), this.getShareUrl(), this.chu.get("localImage"));
            }
        }), "share_twitter");
    },
    /**
        Open pinterest share dialog
    */
    pinterest: function() {
        App.requireSignIn(enyo.bind(this, function() {
            if (App.checkConnection() && this.checkSynced() && this.checkUploaded()) {
                App.sharePinterest(this.getShareUrl(), this.chu.get("localImage") || this.chu.get("image"));
            }
        }), "share_pinterest");
    },
    /**
        Share image via instagram
    */
    instagram: function() {
        App.shareInstagram(this.getMessage(), this.chu.get("localImage") || this.chu.get("image"));
    },
    /**
        Open sms composer with message / link
    */
    sms: function() {
        App.requireSignIn(enyo.bind(this, function() {
            if (this.checkSynced() && this.checkUploaded()) {
                App.shareMessaging(this.getMessage(), this.getShareUrl());
            }
        }), "share_messenger");
        return true;
    },
    /**
        Open email composer with message / link
    */
    email: function() {
        App.requireSignIn(enyo.bind(this, function() {
            if (this.checkSynced() && this.checkUploaded()) {
                App.shareEmail(this.getMessage(), this.getShareUrl());
            }
        }), "share_email");
    },
    moreComments: function() {
        this.$.moreComments.hide();
        this.$.moreCommentsSpinner.show();
        this.chu.comments.fetchNext();
    },
    showLikes: function() {
        this.doShowUserList({users: this.chu.likes});
    },
    scrollToBottom: function() {
        var s = this.$.contentScroller.getStrategy();
        s.scrollTop = s.getScrollBounds().maxTop;
        s.start();
    },
    scrollToLikes: function() {
        if (this.hasNode() && this.$.likesContainer.hasNode()) {
            var s = this.$.contentScroller.getStrategy();
            var b = this.$.likesContainer.getBounds();
            var cHeight = this.$.contentContainer.getBounds().height;
            s.scrollTop = b.top + b.height - cHeight + 10;
            s.start();
        }
    },
    deleteComment: function(sender, event) {
        var comment = this.chu.comments.at(event.index);
        comment.destroy();
        this.refreshComments();
    },
    deleteCommentButtonTapped: function(sender, event) {
        App.confirm(
            $L("Delete Comment"),
            $L("Are you sure you want to delete this comment? This action cannot be undone."),
            enyo.bind(this, function(choice) {
                if (choice) {
                    this.deleteComment(sender, event);
                }
            }),
            [$L("Cancel"), $L("Delete")]
        );
    },
    activate: function() {
        this.$.imageContainer.show();
        this.$.contentContainer.show();
        this.$.commentInputContainer.show();
        this.resized();
    },
    deactivate: function() {
        this.$.imageContainer.hide();
        this.$.contentContainer.hide();
        this.$.commentInputContainer.hide();
    },
    components: [
        {kind: "Heart", classes: "absolute-center"},
        {name: "imageContainer", classes: "chuview-image-container", components: [
            {kind: "Spinner", name: "spinner", classes: "absolute-center"},
            {kind: "Image", name: "image", onload: "imageLoaded", classes: "chuview-image"}
        ]},
        // CONTROLS
        {kind: "FittableRows", name: "controls", classes: "chuview-controls enyo-fill", components: [
            // HEADER
            {classes: "header", components: [
                {classes: "header-icon back", ontap: "doBack"},
                {name: "shareControls", classes: "chuview-share-controls", components: [
                    {classes: "header-icon messaging", ontap: "sms"},
                    {classes: "header-icon facebook", name: "facebookButton", ontap: "facebook"},
                    {classes: "header-icon twitter", ontap: "twitter"},
                    {classes: "header-icon instagram", ontap: "instagram", name: "instagramButton"}
                ]}
            ]},
            {fit: true, name: "contentContainer", style: "position: relative; overflow: hidden;", components: [
                {kind: "Scroller", name: "contentScroller", touch: true, onScroll: "positionImage",
                    strategyKind: "TransitionScrollStrategy", preventScrollPropagation: false, components: [
                    // SPACER
                    {classes: "chuview-spacer", components: [
                        {classes: "chuview-price", name: "price"}
                    ]},
                    // LIKE BAR
                    {classes: "chuview-bar", components: [
                        {kind: "Button", ontap: "showUser", classes: "chuview-user-button", components: [
                            {kind: "Image", classes: "chuview-avatar", name: "avatar"},
                            {classes: "chuview-fullname ellipsis", name: "fullName"},
                            {classes: "chuview-store ellipsis", name: "store"}
                        ]},
                        {kind: "Button", classes: "chuview-store-button", ontap: "showStore", components: [
                            {classes: "chuview-store-icon"}
                        ]},
                        {kind: "Button", name: "likeButton", classes: "chuview-heart-button", ontap: "likeButtonTapped", components: [
                            // {classes: "chufeeditem-heart-animated"},
                            {classes: "chuview-heart-icon"}
                        ]}
                    ]},
                    {classes: "chuview-content", components: [
                        {name: "likesContainer", classes: "chuview-likes-container", ontap: "showLikes", components: [
                            {classes: "chuview-likes-text", name: "likesText"},
                            // {kind: "Spinner", classes: "chuview-likes-spinner", name: "likesSpinner", showing: false},
                            {kind: "Repeater", classes: "chuview-likes", name: "likesRepeater", onSetupItem: "setupLike", components: [
                                {kind: "Image", name: "likeImage", classes: "chuview-like-image"}
                            ]}
                        ]},
                        {name: "commentsContainer", components: [
                            {classes: "chuview-more-comments", content: $L("Load more comments..."), name: "moreComments", ontap: "moreComments"},
                            {kind: "Spinner", classes: "chuview-comments-spinner", name: "moreCommentsSpinner", showing: false},
                            // COMMENTS
                            {kind: "FlyweightRepeater", classes: "chuview-comments", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                                {classes: "list-item chuview-comment", name: "comment", components: [
                                    {components: [
                                        {kind: "Image", name: "commentAvatar", classes: "chuview-comment-avatar", ontap: "showCommentUser"}
                                    ]},
                                    {classes: "chuview-comment-content", components: [
                                        {classes: "chuview-comment-delete-button", name: "commentDeleteButton", ontap: "deleteCommentButtonTapped", showing: false},
                                        {classes: "chuview-comment-time", name: "commentTime"},
                                        {classes: "chuview-comment-fullname ellipsis", name: "commentFullName", ontap: "showCommentUser"},
                                        {name: "commentText", classes: "chuview-comment-text"}
                                    ]}
                                ]}
                            ]},
                            {kind: "Spinner", classes: "chuview-comments-spinner", name: "commentsSpinner", showing: false}
                        ]},
                        {style: "height: 505px"}
                    ]}
                ]}
            ]},
            // COMMENT INPUT
            {name: "commentInputContainer", classes: "chuview-commentinput", components: [
                {kind: "onyx.InputDecorator", classes: "chuview-commentinput-decorator", alwaysLooksFocused: true, components: [
                    {kind: "onyx.TextArea", name: "commentInput", placeholder: $L("Comment..."), onkeydown: "commentInputKeydown"}
                ]},
                {kind: "Button", classes: "chuview-commentinput-button", content: $L("send"), ontap: "commentEnter"}
            ]}
        ]},
        {kind: "Signals", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
    ]
});