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
    scrollerOffset: 20,
    twitterUrl: "http://twitter.com/share/",
    pinterestUrl: "http://pinterest.com/pin/create/button/",
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        var s = this.$.contentScroller.getStrategy();
        s.scrollIntervalMS = 20;
        s.maxScrollTop = -60;
    },
    imageLoaded: function() {
        this.$.spinner.hide();
        this.$.image.removeClass("loading");
        this.arrangeImage();
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
            this.$.image.addClass("loading");
            this.$.image.setSrc(image);
        }

        this.$.avatar.setSrc(user && user.profile && user.profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
        this.$.fullName.setContent(user ? (user.first_name + " " + user.last_name) : "");
        this.$.store.setContent(store && store.name || "");

        var currFmt = new enyo.g11n.NumberFmt({style: "currency", fractionDigits: 0, currency: this.chu.get("price_currency"), locale: store && store.country && store.country.toLowerCase() || undefined});
        this.$.price.setContent(this.chu.get("price") ? currFmt.format(this.chu.get("price")) : "");

        var likesCount = this.chu.get("likes_count");
        var likesText = this.chu.get("likes_count") == 1 ? $L("1 person likes this") : $L("{{ count }} people like this").replace("{{ count }}", likesCount);
        this.$.likesText.setContent(likesText);
        this.$.likesContainer.setShowing(this.likesCount);

        this.$.likeButton.addRemoveClass("active", this.chu.get("liked"));

        this.$.shareControls.setShowing(this.chu.get("visibility") == "public");
    },
    /**
        Configures the image view to the right zoom and scroll position to allow parallax scrolling
    */
    arrangeImage: function() {
        // var s = this.$.imageScroller.getStrategy().$.scrollMath;
        // s.kSpringDamping = 1;
        // s.setScrollY(this.scrollerOffset);
        // s.start();
        this.$.imageScroller.setScrollTop(this.$.contentScroller.getScrollTop()/3.5 + this.scrollerOffset);
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
                // If user has activated sharing likes, make sure that we have publishing permissions.
                // If not, ask him again (if a certain period of time has passed)
                if (user && user.profile.get("fb_og_share_likes")) {
                    App.fbRequestPublishPermissions();
                    this.toggleLike();
                } else {
                    App.optInSetting("fb_og_share_likes", $L("Share on Facebook"),
                        $L("Do you want to share your likes on Facebook? Some goodies can only be received if you share your stories! " +
                            "You can change this later in your settings."), 7 * 24 * 60 * 60 * 1000, enyo.bind(this, function(choice) {
                            if (choice) {
                                App.fbRequestPublishPermissions();
                            }
                            this.toggleLike();
                        }));
                }
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
            App.sendCubeEvent(this.chu.get("liked") ? "like" : "unlike", {
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
        this.$.moreComments.setContent($L("{count} more comments...").replace("{count}", totalCount - this.chu.comments.length));
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
        var avatar = user.profile.avatar_thumbnail || user.profile.avatar || "assets/images/avatar_thumbnail_placeholder.png";
        this.$.commentAvatar.setSrc(avatar);
        this.$.commentFullName.setContent(comment.get("user").first_name + " " + comment.get("user").last_name);
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
            App.sendCubeEvent("comment", {
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
    scroll: function(sender, inEvent) {
        // var s = this.$.imageScroller.getStrategy().$.scrollMath;
        // s.setScrollY(Math.max(this.scrollerOffset-this.$.contentScroller.getScrollTop()/3.5), -100);
        // s.scroll();
        this.arrangeImage();
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
        this.arrangeImage();
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
                window.plugins.social.available("facebook", enyo.bind(this, function(available) {
                    if (available) {
                        window.plugins.social.facebook(this.getMessage(), this.getShareUrl(), this.chu.get("localImage") || this.chu.get("image"), enyo.bind(this, function() {
                            App.sendCubeEvent("share_facebook_success", {
                                chu: this.chu
                            });
                        }), enyo.bind(this, function() {
                            App.sendCubeEvent("share_facebook_fail", {
                                chu: this.chu
                            });
                        }));
                    } else {
                        var params = {
                            method: "feed",
                            link: this.getShareUrl(),
                            picture: this.chu.get("image")
                        };
                        FB.ui(params, function(obj) {
                            App.sendCubeEvent(obj && obj.post_id ? "share_facebook_success" : "share_facebook_fail", {
                                chu: this.chu
                            });
                        });
                    }
                }));
            }
        }), "share_facebook");
    },
    /**
        Open twitter share dialog
    */
    twitter: function() {
        App.requireSignIn(enyo.bind(this, function() {
            if (App.checkConnection() && this.checkSynced() && this.checkUploaded()) {
                window.plugins.social.available("twitter", enyo.bind(this, function(available) {
                    if (available) {
                        window.plugins.social.twitter(this.getMessage(), this.getShareUrl(), this.chu.get("localImage") || this.chu.get("image"), enyo.bind(this, function() {
                            App.sendCubeEvent("share_twitter_success", {
                                chu: this.chu
                            });
                        }), enyo.bind(this, function() {
                            App.sendCubeEvent("share_twitter_fail", {
                                chu: this.chu
                            });
                        }));
                    } else {
                        var url = this.twitterUrl + "?text=" + encodeURIComponent(this.getMessage()) + "&url=" + encodeURIComponent(this.getShareUrl()) + "&via=Chuisy";
                        window.open(url, "_blank");
                        App.sendCubeEvent("share_twitter_web", {
                            chu: this.chu
                        });
                    }
                }));
            }
        }), "share_twitter");
    },
    /**
        Open pinterest share dialog
    */
    pinterest: function() {
        App.requireSignIn(enyo.bind(this, function() {
            if (App.checkConnection() && this.checkSynced() && this.checkUploaded()) {
                var url = this.getShareUrl();
                var media = this.chu.get("image");
                window.location = this.pinterestUrl + "?url=" + encodeURIComponent(url) + "&media=" + encodeURIComponent(media);
                App.sendCubeEvent("share_pinterest", {
                    chu: this.chu
                });
            }
        }), "share_pinterest");
    },
    /**
        Share image via instagram
    */
    instagram: function() {
        var start = new Date();
        util.watermark(this.chu.get("image"), enyo.bind(this, function(dataUrl) {
            Instagram.share(dataUrl, this.getMessage(), function(err) {
                App.sendCubeEvent(err ? "share_instagram_fail" : "share_instagram_success", {
                    chu: this.chu
                });
            });
        }));
    },
    /**
        Open sms composer with message / link
    */
    sms: function() {
        App.requireSignIn(enyo.bind(this, function() {
            if (this.checkSynced() && this.checkUploaded()) {
                var message = this.getMessage();
                window.plugins.smsComposer.showSMSComposer("", message + " " + this.getShareUrl(), function(result) {
                    App.sendCubeEvent(result == 1 ? "share_messenger_success" : "share_messenger_cancel", {
                        chu: this.chu
                    });
                });
            }
        }), "share_messenger");
        event.preventDefault();
        return true;
    },
    /**
        Open email composer with message / link
    */
    email: function() {
        App.requireSignIn(enyo.bind(this, function() {
            if (this.checkSynced() && this.checkUploaded()) {
                var subject = $L("Hi there!");
                var message = this.getMessage();
                window.plugins.emailComposer.showEmailComposer(subject, message + " " + this.getShareUrl());
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
        this.$.imageScroller.show();
        this.$.contentContainer.show();
        this.resized();
    },
    deactivate: function() {
        this.$.imageScroller.hide();
        this.$.contentContainer.hide();
    },
    components: [
        // IMAGEVIEW
        {kind: "Scroller", name: "imageScroller", thumb: false, classes: "chuview-image-scroller", components: [
            {classes: "chuview-image-container", components: [
                {kind: "Spinner", name: "spinner", classes: "chuview-image-spinner"},
                {kind: "Image", name: "image", onload: "imageLoaded", classes: "chuview-image"}
            ]}
        ]},
        // CONTROLS
        {kind: "FittableRows", name: "controls", classes: "chuview-controls enyo-fill", components: [
            // HEADER
            {classes: "header", components: [
                {kind: "Button", content: $L("back"), ontap: "doBack", classes: "header-button left"},
                {name: "shareControls", classes: "chuview-share-controls", components: [
                    {classes: "chuview-header-button messaging", ontap: "sms"},
                    {classes: "chuview-header-button facebook", name: "facebookButton", ontap: "facebook"},
                    {classes: "chuview-header-button twitter", ontap: "twitter"},
                    {classes: "chuview-header-button instagram", ontap: "instagram"}
                ]}
            ]},
            {fit: true, name: "contentContainer", style: "position: relative; overflow: hidden;", components: [
                {kind: "Scroller", name: "contentScroller", touch: true, touchOverscroll: true, thumb: false, onScroll: "scroll",
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
                            {classes: "chuview-more-comments", content: "Load more comments...", name: "moreComments", ontap: "moreComments"},
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
            {classes: "chuview-commentinput", components: [
                {kind: "onyx.InputDecorator", classes: "chuview-commentinput-decorator", alwaysLooksFocused: true, components: [
                    {kind: "onyx.TextArea", name: "commentInput", placeholder: $L("Comment..."), onkeydown: "commentInputKeydown"}
                ]},
                {kind: "Button", classes: "chuview-commentinput-button", content: $L("send"), ontap: "commentEnter"}
            ]}
        ]},
        {kind: "Signals", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
    ]
});