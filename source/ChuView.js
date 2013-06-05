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
        liked: false,
        buttonLabel: $L("back")
    },
    events: {
        //* User has tapped the back button
        onBack: "",
        //* User has tapped the share button
        onShare: "",
        //* User has tapped the avatar or name of the chus author
        onShowUser: "",
        onDone: "",
        onInviteFriends: "",
        onShowStore: ""
    },
    handlers: {
        onpostresize: "postResize"
    },
    scrollerOffset: 20,
    twitterUrl: "http://twitter.com/share/",
    pinterestUrl: "http://pinterest.com/pin/create/button/",
    friends: [],
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        var s = this.$.contentScroller.getStrategy();
        s.scrollIntervalMS = 20;
        s.maxScrollTop = -60;
        this.buttonLabelChanged();
    },
    buttonLabelChanged: function() {
        this.$.doneButton.setContent(this.buttonLabel);
    },
    setupFriends: function() {
        var user = chuisy.accounts.getActiveUser();
        if (user) {
            this.$.peoplePicker.setItems(user.friends.models);
            this.$.friendsPanels.setIndex(user.friends.length ? 0 : 1);
            this.listenTo(user.friends, "sync", function() {
                this.$.peoplePicker.setItems(user.friends.models);
                this.$.friendsPanels.setIndex(user.friends.length ? 0 : 1);
            });
        }
    },
    imageLoaded: function() {
        this.$.spinner.hide();
        this.$.image.removeClass("loading");
        this.arrangeImage();
    },
    showLoadingPanel: function() {
        this.$.loadingPanel.show();
        enyo.asyncMethod(this, function() {
            this.$.loadingPanel.removeClass("fade");
        });
    },
    hideLoadingPanel: function() {
        this.$.loadingPanel.addClass("fade");
        setTimeout(enyo.bind(this, function() {
            this.$.loadingPanel.hide();
        }), 500);
    },
    chuChanged: function() {
        this.updateView();
        this.syncStatusChanged();
        this.stopListening();
        if (this.chu.get("stub")) {
            this.showLoadingPanel();
            this.chu.fetch({success: enyo.bind(this, function() {
                this.hideLoadingPanel();
                this.chu.set({"stub": false}, {silent: true});
            })});
        }
        this.listenTo(this.chu, "change", this.updateView);
        this.listenTo(this.chu, "change:syncStatus", this.syncStatusChanged);
        this.setupFriends();
        this.$.commentsCount.setContent(this.chu.get("comments_count") || 0);
        this.refreshComments();
        this.refreshLikes();
        this.listenTo(this.chu.comments, "sync", this.refreshComments);
        this.listenTo(this.chu.likes, "sync", this.refreshLikes);
        this.$.likesList.setUsers(this.chu.likes);
        // this.listenTo(this.chu.comments, "request", this.commentsLoading);
        if (this.chu.get("url")) {
            this.loadComments();
            this.loadLikes();
        }
        this.listenTo(this.chu, "sync", this.chuChanged);
    },
    updateView: function() {
        var user = this.chu.get("user");
        var store = this.chu.get("store");

        var image = this.chu.get("localImage") || this.chu.get("image") || "assets/images/chu_placeholder.png";
        if (image != this.$.image.src) {
            this.$.spinner.show();
            this.$.image.addClass("loading");
            this.$.image.setSrc(image);
        }

        this.$.storeButton.setShowing(store && store.foursquare_id);
        this.$.store.setShowing(!store || !store.foursquare_id);

        this.$.avatar.setSrc(user && user.profile && user.profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
        this.$.fullName.setContent(user ? (user.first_name + " " + user.last_name) : $L("Not signed in..."));
        this.$.store.setContent(store && store.name || "");
        this.$.storeButtonText.setContent(store && store.name || "");
        this.$.time.setContent(this.chu.getTimeText());

        var currFmt = new enyo.g11n.NumberFmt({style: "currency", fractionDigits: 0, currency: this.chu.get("price_currency"), locale: store && store.country && store.country.toLowerCase() || undefined});
        this.$.price.setContent(this.chu.get("price") ? currFmt.format(this.chu.get("price")) : "");

        this.addRemoveClass("owned", this.isOwned());

        this.setLiked(this.chu.get("liked"));
        this.$.likesCount.setContent(this.chu.get("likes_count") || 0);

        this.adjustShareControls();
    },
    syncStatusChanged: function() {
        switch (this.chu.get("syncStatus")) {
            case "posting":
                this.$.syncStatus.show();
                this.$.statusErrorIcon.hide();
                this.$.statusSpinner.show();
                this.$.statusText.setContent($L("Posting Chu"));
                break;
            case "uploading":
                this.$.syncStatus.show();
                this.$.statusErrorIcon.hide();
                this.$.statusSpinner.show();
                this.$.statusText.setContent($L("Uploading image"));
                break;
            case "postFailed":
                this.$.syncStatus.show();
                this.$.statusErrorIcon.show();
                this.$.statusSpinner.hide();
                this.$.statusText.setContent($L("Post failed"));
                break;
            case "uploadFailed":
                this.$.syncStatus.show();
                this.$.statusErrorIcon.show();
                this.$.statusSpinner.hide();
                this.$.statusText.setContent($L("Upload failed"));
                break;
            default:
                this.$.syncStatus.hide();
                break;
        }
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
    likedChanged: function() {
        this.addRemoveClass("liked", this.liked);
        this.$.likeButton.addRemoveClass("active", this.liked);
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
                chu: this.chu
            });
        }
    },
    refreshComments: function() {
        var totalCount = this.chu.comments.meta && this.chu.comments.total_count || this.chu.get("comments_count") || 0;
        this.$.commentsSpinner.hide();
        this.$.moreCommentsSpinner.hide();
        this.$.moreComments.setShowing(this.chu.comments.hasNextPage());
        this.$.moreComments.setContent($L("{count} more comments...").replace("{count}", totalCount - this.chu.comments.length));
        this.$.commentsCount.setContent(totalCount);
        this.$.commentsRepeater.setCount(this.chu.comments.length);
        this.$.commentsRepeater.render();
        this.$.commentsContainer.setShowing(this.chu.comments.length);
    },
    refreshLikes: function() {
        this.$.likesSpinner.hide();
        this.$.likesRepeater.show();
        var max = 8;
        var count = this.chu.likes.meta && this.chu.likes.meta.total_count || this.chu.get("likes_count") || 0;
        count = Math.max(count, this.chu.likes.length);
        this.$.likesCount.setContent(count);
        this.$.likesRepeater.setCount(Math.min(this.chu.likes.length, max));
        this.$.likesRepeater.render();
        this.$.moreLikes.setShowing(count > max);
        this.$.moreLikes.setContent("+" + (count - max));
        // this.$.moreLikes.addRemoveClass("big", (count - max) > 99);
        this.$.likesContainer.setShowing(count);
    },
    loadComments: function() {
        this.$.moreComments.hide();
        this.$.commentsSpinner.show();
        this.$.commentsContainer.show();
        this.chu.comments.fetch({data: {limit: 5}});
    },
    loadLikes: function() {
        this.$.likesSpinner.show();
        this.$.likesRepeater.hide();
        this.$.moreLikes.hide();
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
        if (!user && !App.isSignedIn()) {
            enyo.Signals.send("onRequestSignIn", {
                context: "other"
            });
        } else if (user && App.checkConnection()) {
            this.doShowUser({user: user});
        }
    },
    showCommentUser: function(sender, event) {
        if (App.checkConnection()) {
            this.doShowUser({user: this.chu.comments.at(event.index).get("user")});
        }
    },
    showStore: function(sender, event) {
        this.doShowStore({store: this.chu.get("store")});
    },
    postResize: function() {
        this.$.contentScroller.applyStyle("height", (this.$.contentContainer.getBounds().height + 500) + "px");
        this.arrangeImage();
    },
    toggleVisibility: function() {
        App.requireSignIn(enyo.bind(this, function() {
            var visibility = this.chu.get("visibility") == "public" ? "private" : "public";
            this.chu.save({visibility: visibility});
            if (visibility == "public") {
                this.$.friendsSlider.animateToMax();
            }

            App.sendCubeEvent("toggle_visibility", {
                chu: this.chu
            });
        }), "toggle_visibility");
    },
    adjustShareControls: function() {
        this.$.visibilityButton.addRemoveClass("public", this.chu.get("visibility") == "public");
        this.$.sharePanels.setIndex(this.chu.get("visibility") == "public" ? 1 : 0);
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
                        window.plugins.social.facebook(this.getMessage(), this.getShareUrl(), this.chu.get("localImage"), enyo.bind(this, function() {
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
                        window.plugins.social.twitter(this.getMessage(), this.getShareUrl(), this.chu.get("localImage"), enyo.bind(this, function() {
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
    toggleFriends: function() {
        App.requireSignIn(enyo.bind(this, function() {
            this.$.friendsSlider.toggleMinMax();
        }), "tag_friends");
    },
    friendsOpened: function() {
        this.$.friendsButton.addClass("active");
        var friends = [];
        for (var i=0; i<this.chu.get("friends").length; i++) {
            friends.push(new chuisy.models.User(this.chu.get("friends")[i]));
        }
        this.$.peoplePicker.setSelectedItems(friends);
        this.$.doneButton.setContent($L("done"));
        App.sendCubeEvent("open_friends_picker", {
            chu: this.chu
        });
    },
    friendsClosed: function() {
        this.$.friendsButton.removeClass("active");
        if (this.friendsChanged) {
            var friends = [];
            var friendsModels = this.$.peoplePicker.getSelectedItems();

            for (var i=0; i<friendsModels.length; i++) {
                friends.push(friendsModels[i].toJSON());
            }

            this.chu.save({friends: friends});
            if (App.isSignedIn()) {
                chuisy.closet.syncRecords();
            }
            this.friendsChanged = false;
            App.sendCubeEvent("tag_friends", {
                chu: this.chu
            });
        }
        this.buttonLabelChanged();
    },
    friendsChangedHandler: function() {
        this.friendsChanged = true;
    },
    isFriendsSliderOpen: function() {
        return this.$.friendsSlider.getValue() == this.$.friendsSlider.getMin();
    },
    friendsSliderAnimateFinish: function() {
        if (this.isFriendsSliderOpen()) {
            this.friendsOpened();
        } else {
            this.friendsClosed();
        }
    },
    done: function() {
        if (this.isFriendsSliderOpen()) {
            this.$.friendsSlider.animateToMax();
        } else if (this.isNew) {
            this.isNew = false;
            this.doDone({chu: this.chu});
        } else {
            this.doBack();
        }
    },
    activate: function(obj) {
        this.$.panels.setIndex(0);
        this.setChu(obj);
        if (obj == this.chu) {
            // this.chuChanged (for some reason) not automatically called if the set object is identical to the previous one
            // So in that case we have to call it explicitly
            this.chuChanged();
        }
        this.$.friendsButton.removeClass("active");
        this.$.friendsSlider.setValue(100);
        var user = chuisy.accounts.getActiveUser();
        if (user) {
            user.friends.fetch();
        }
        // if (this.isNew) {
        //     enyo.Signals.send("onShowGuide", {view: "chu"});
        // }
        enyo.asyncMethod(this, function() {
            this.$.contentScroller.scrollToTop();
        });
    },
    deactivate: function() {
        this.blurredByTap = false;
        this.$.commentInput.setValue("");
        this.$.image.setSrc("assets/images/chu_image_placeholder.png");
        this.$.friendsSlider.setValue(this.$.friendsSlider.getMax());
        this.friendsClosed();
    },
    syncStatusTapped: function() {
        if (this.chu.get("syncStatus") == "postFailed" || this.chu.get("syncStatus") == "uploadFailed") {
            App.confirm(
                $L("Upload failed"),
                $L("Sorry, we couldn't upload your Chu just now. Please try again later!"),
                enyo.bind(this, function(choice) {
                    if (!choice) {
                        chuisy.closet.syncRecords();
                    }
                }),
                [$L("Try again"), $L("OK")]
            );


            // navigator.notification.confirm($L("Sorry, we couldn't upload your Chu just now. Please try again later!"), enyo.bind(this, function(choice) {
            //     if (choice == 1) {
            //         chuisy.closet.syncRecords();
            //     }
            // }), $L("Upload failed"), [$L("Try again"), $L("OK")].join(","));

        }
    },
    moreComments: function() {
        this.$.moreComments.hide();
        this.$.moreCommentsSpinner.show();
        this.chu.comments.fetchNext();
    },
    showLikes: function() {
        this.$.panels.setIndex(1);
    },
    likesBack: function() {
        this.$.panels.setIndex(0);
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
            this.log(cHeight);
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
    components: [
        {kind: "Panels", arrangerKind: "CarouselArranger", classes: "enyo-fill", draggable: false, components: [
            {classes: "enyo-fill", components: [
                {name: "loadingPanel", classes: "chuview-loading-panel", showing: false, ontap: "hideLoadingPanel", components: [
                    {classes: "chuview-loading-content", components: [
                        {kind: "CssSpinner", name: "loadingSpinner", classes: "chuview-loading-spinner", color: "#fff"},
                        {content: $L("Loading..."), classes: "chuview-loading-text"}
                    ]},
                    {classes: "chuview-loading-dismiss", content: $L("(tap to dismiss)")}
                ]},
                // IMAGEVIEW
                {kind: "Scroller", name: "imageScroller", thumb: false, classes: "chuview-image-scroller", components: [
                    {classes: "chuview-image-container", components: [
                        {kind: "CssSpinner", name: "spinner", classes: "absolute-center"},
                        {kind: "Image", name: "image", onload: "imageLoaded", classes: "chuview-image"}
                    ]}
                ]},
                // CONTROLS
                {kind: "FittableRows", name: "controls", classes: "chuview-controls enyo-fill", components: [
                    // HEADER
                    {classes: "header", components: [
                        {kind: "Button", name: "doneButton", ontap: "done", classes: "header-button left"},
                        {classes: "chuview-share-controls", components: [
                            {kind: "Panels", name: "sharePanels", draggable: false, classes: "chuview-share-panels", arrangerKind: "CarouselArranger", components: [
                                {classes: "enyo-fill", components: [
                                    {classes: "chuview-header-button messaging", ontap: "sms"},
                                    {classes: "chuview-header-button friends", name: "friendsButton", ontap: "toggleFriends"}
                                ]},
                                {classes: "enyo-fill", components: [
                                    {classes: "chuview-header-button messaging", ontap: "sms"},
                                    {classes: "chuview-header-button facebook", name: "facebookButton", ontap: "facebook"},
                                    {classes: "chuview-header-button twitter", ontap: "twitter"},
                                    {classes: "chuview-header-button instagram", ontap: "instagram"}
                                ]}
                            ]},
                            {classes: "chuview-visibility", name: "visibilityButton", ontap: "toggleVisibility"}
                        ]}
                    ]},
                    {fit: true, name: "contentContainer", style: "position: relative; overflow: hidden;", components: [
                        {kind: "Scroller", name: "contentScroller", touch: true, touchOverscroll: true, thumb: false, onScroll: "scroll",
                            strategyKind: "TransitionScrollStrategy", preventScrollPropagation: false, components: [
                            // SPACER
                            {classes: "chuview-spacer", ontap: "hideControls"},
                            // LIKE BAR
                            {classes: "chuview-likebar", components: [
                                {classes: "chuview-like-button", name: "likeButton", ontap: "likeButtonTapped", components: [
                                    {classes: "chuview-like-button-side back"},
                                    {classes: "chuview-like-button-side front"}
                                ]},
                                {classes: "chuview-status", name: "syncStatus", ontap: "syncStatusTapped", components: [
                                    {classes: "chuview-status-error-icon", name: "statusErrorIcon", showing: false},
                                    {kind: "CssSpinner", name: "statusSpinner", classes: "chuview-status-spinner"},
                                    {name: "statusText", classes: "chuview-status-text"}
                                ]}
                            ]},
                            {classes: "chuview-content", components: [
                                // CATEGORY, PRICE, COMMENTS, LIKES
                                {classes: "chuview-store-price", components: [
                                    // {classes: "chuview-category-icon", name: "categoryIcon", showing: false},
                                    {classes: "chuview-price", name: "price"},
                                    {kind: "Button", classes: "chuview-store-button", name: "storeButton", showing: false, ontap: "showStore", components: [
                                        {name: "storeButtonText", classes: "chuview-store-button-text ellipsis"},
                                        {tag: "img", classes: "chuview-store-icon", attributes: {src: "assets/images/black_marker.png"}}
                                    ]},
                                    {name: "store", classes: "chuview-store ellipsis", showing: false},
                                    {classes: "chuview-likes-comments", showing: false, components: [
                                        {classes: "chuview-likes-count", name: "likesCount"},
                                        {classes: "chuview-likes-icon"},
                                        {classes: "chuview-comments-count", name: "commentsCount"},
                                        {classes: "chuview-comments-icon"}
                                    ]}
                                ]},
                                // AVATAR, NAME, TIME
                                {classes: "chuview-infobar", components: [
                                    {kind: "Image", classes: "chuview-avatar", name: "avatar", ontap: "showUser"},
                                    {classes: "chuview-fullname ellipsis", name: "fullName", ontap: "showUser"},
                                    {classes: "chuview-time", name: "time"}
                                ]},
                                {name: "likesContainer", ontap: "showLikes", components: [
                                    {classes: "chuview-separator", components: [
                                        {classes: "chuview-separator-line"},
                                        {classes: "chuview-separator-icon chuview-likes-icon", style: "position: relative; top: 2px;"},
                                        {classes: "chuview-separator-line"}
                                    ]},
                                    {kind: "CssSpinner", classes: "chuview-likes-spinner", name: "likesSpinner", showing: false},
                                    {kind: "Repeater", classes: "chuview-likes", name: "likesRepeater", onSetupItem: "setupLike", components: [
                                        {kind: "Image", name: "likeImage", classes: "chuview-like-image"}
                                    ]},
                                    {classes: "chuview-likes-more", name: "moreLikes"}
                                ]},
                                {name: "commentsContainer", components: [
                                    {classes: "chuview-separator", components: [
                                        {classes: "chuview-separator-line"},
                                        {classes: "chuview-separator-icon chuview-comments-icon", style: "position: relative; top: 2px;"},
                                        {classes: "chuview-separator-line"}
                                    ]},
                                    {classes: "chuview-more-comments", content: "Load more comments...", name: "moreComments", ontap: "moreComments"},
                                    {kind: "CssSpinner", classes: "chuview-comments-spinner", name: "moreCommentsSpinner", showing: false},
                                    // COMMENTS
                                    {kind: "FlyweightRepeater", classes: "chuview-comments", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                                        {classes: "chuview-comment", name: "comment", components: [
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
                                    {kind: "CssSpinner", classes: "chuview-comments-spinner", name: "commentsSpinner", showing: false}
                                ]},
                                {style: "height: 505px"}
                            ]}
                        ]},
                        {kind: "Slideable", name: "friendsSlider", unit: "%", min: 0, max: 100, value: 100, axis: "v",
                            classes: "chuview-friends-slider", overMoving: false, onAnimateFinish: "friendsSliderAnimateFinish", components: [
                            {kind: "Panels", classes: "enyo-fill", name: "friendsPanels", animate: false, draggable: false, components: [
                                {kind: "FittableRows", components: [
                                    {kind: "PeoplePicker", fit: true, onChange: "friendsChangedHandler"},
                                    {classes: "chuview-friends-hint", content: $L("Select the people you want to share this Chu with!")}
                                ]},
                                {style: "padding: 80px 8px;", components: [
                                    {classes: "placeholder-image chuview-friends-placeholder-image"},
                                    {classes: "chuview-friends-hint", style: "padding: 20px 40px;", content: $L("You don't have any friends on Chuisy yet! Friends are people you follow that follow you back.")},
                                    {kind: "Button", content: $L("Invite Friends"), style: "width: 100%", ontap: "doInviteFriends"}
                                ]}
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
                {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
            ]},
            {kind: "FittableRows", classes: "enyo-fill", style: "overflow: hidden", components: [
                {classes: "header", components: [
                    {kind: "Button", ontap: "likesBack", classes: "header-button left", content: $L("back")}
                ]},
                {kind: "UserList", name: "likesList", fit: true}
            ]}
        ]}
    ]
});