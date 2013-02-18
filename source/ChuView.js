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
        onInviteFriends: ""
    },
    handlers: {
        onpostresize: "postResize",
        onload: "loaded"
    },
    scrollerOffset: 20,
    twitterUrl: "http://twitter.com/share/",
    pinterestUrl: "http://pinterest.com/pin/create/button/",
    friends: [],
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        this.setupFriends();
        this.listenTo(chuisy.accounts, "change:active_user", this.setupFriends);
        var s = this.$.contentScroller.getStrategy().$.scrollMath;
        if (s) {
            s.kDragDamping = 0.2;
            s.kSnapFriction = 0.4;
        }
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
            this.stopListening();
            this.listenTo(user.friends, "reset add", function() {
                this.$.peoplePicker.setItems(user.friends.models);
                this.$.friendsPanels.setIndex(user.friends.length ? 0 : 1);
            });
        }
    },
    loaded: function() {
        this.$.spinner.hide();
        this.$.image.removeClass("loading");
        this.arrangeImage();
    },
    chuChanged: function() {
        this.updateView();
        this.refreshComments();
        this.stopListening();
        this.listenTo(this.chu, "change", this.updateView);
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
    },
    updateView: function() {
        var user = this.chu.get("user");
        var loc = this.chu.get("location");

        var image = this.chu.get("localImage") || this.chu.get("thumbnails") && this.chu.get("thumbnails")["300x300"] || this.chu.get("image") || "assets/images/chu_placeholder.png";
        if (image != this.$.image.src) {
            this.$.spinner.show();
            this.$.image.addClass("loading");
            this.$.image.setSrc(image);
        }

        this.$.avatar.setSrc(user && user.profile && user.profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
        this.$.fullName.setContent(user ? (user.first_name + " " + user.last_name) : "");
        this.$.location.setContent(loc && loc.name || "");
        this.$.headerText.setContent("#" + this.chu.id);
        this.$.time.setContent(this.chu.getTimeText());

        var currFmt = new enyo.g11n.NumberFmt({style: "currency", currency: this.chu.get("price_currency"), locale: loc && loc.country || undefined});
        this.$.price.setContent(this.chu.get("price") ? currFmt.format(this.chu.get("price")) : "");

        this.addRemoveClass("owned", this.isOwned());

        this.setLiked(this.chu.get("liked"));
        this.$.likesCount.setContent(this.chu.get("likes_count") || 0);

        this.adjustShareControls();
        this.$.errorIcon.setShowing(this.chu.get("syncFailed") || this.chu.get("uploadFailed"));
    },
    /**
        Configures the image view to the right zoom and scroll position to allow parallax scrolling
    */
    arrangeImage: function() {
        // var s = this.$.imageScroller.getStrategy().$.scrollMath;
        // s.kSpringDamping = 1;
        // s.setScrollY(this.scrollerOffset);
        // s.start();
        this.$.imageScroller.setScrollTop(this.scrollerOffset);
    },
    /**
        Checks if the current user ownes this chu
    */
    isOwned: function() {
        var activeUser = chuisy.accounts.getActiveUser();
        var user = this.chu.get("user");
        return activeUser && (!user || activeUser.id == user.id);
    },
    likedChanged: function() {
        this.addRemoveClass("liked", this.liked);
        this.$.likeButton.addRemoveClass("active", this.liked);
    },
    likeButtonTapped: function() {
        if (App.checkConnection()) {
            if (App.isSignedIn()) {
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
        if (this.checkSynced()) {
            this.chu.toggleLike();
            this.refreshLikes();
        }
    },
    refreshComments: function() {
        this.$.commentsSpinner.hide();
        this.$.moreCommentsButton.setShowing(this.chu.comments.hasNextPage());
        this.$.commentsCount.setContent(this.chu.comments.meta && this.chu.comments.total_count || this.chu.get("comments_count") || 0);
        this.$.commentsRepeater.setCount(this.chu.comments.length);
        this.$.commentsRepeater.render();
    },
    refreshLikes: function() {
        this.$.likesSpinner.hide();
        this.$.likesRepeater.show();
        var max = 7;
        var count = this.chu.likes.meta && this.chu.likes.total_count || this.chu.get("likes_count") || 0;
        this.$.likesCount.setContent(count);
        this.$.likesRepeater.setCount(Math.min(this.chu.likes.length, max));
        this.$.likesRepeater.render();
        this.$.moreLikes.setShowing(count > max);
        this.$.moreLikes.setContent("+" + (count - max));
        this.$.moreLikes.addRemoveClass("big", count > 99);
        this.$.likesContainer.setShowing(count);
    },
    loadComments: function() {
        this.$.moreCommentsButton.hide();
        this.$.commentsSpinner.show();
        this.chu.comments.fetch({data: {limit: 10}});
    },
    loadLikes: function() {
        this.$.likesSpinner.show();
        this.$.likesRepeater.hide();
        this.chu.likes.fetch({data: {limit: 10}});
    },
    setupComment: function(sender, event) {
        var comment = this.chu.comments.at(event.index);
        var user = comment.get("user");
        this.$.commentText.setContent(comment.get("text"));
        this.$.commentAvatar.setSrc(user.profile.avatar_thumbnail || user.profile.avatar || "assets/images/avatar_thumbnail_placeholder.png");
        this.$.commentFullName.setContent(comment.get("user").first_name + " " + comment.get("user").last_name);
        this.$.commentTime.setContent(comment.getTimeText());
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
            if (App.isSignedIn()) {
                this.postComment();
            } else {
                this.$.commentInput.hasNode().blur();
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
        if (this.$.commentInput.getValue() && this.checkSynced()) {
            var attrs = {
                text: this.$.commentInput.getValue(),
                user: chuisy.accounts.getActiveUser().toJSON()
            };
            this.chu.comments.create(attrs);
            this.refreshComments();

            this.$.commentInput.setValue("");

            this.$.contentScroller.scrollTo(0, this.$.contentScroller.getScrollBounds().maxTop);
        }
    },
    online: function() {
        if (this.chu) {
            this.loadComments();
        }
    },
    offline: function() {
    },
    pushNotification: function() {
        // Received a push notification. Let's see whats new.
        this.chu.fetch();
        this.loadComments();
    },
    scroll: function(sender, inEvent) {
        // var s = this.$.imageScroller.getStrategy().$.scrollMath;
        // s.setScrollY(Math.max(this.scrollerOffset-this.$.contentScroller.getScrollTop()/3.5), -100);
        // s.scroll();
        this.$.imageScroller.setScrollTop(this.$.contentScroller.getScrollTop()/3.5 + this.scrollerOffset);
    },
    /**
        Open this chus share view
    */
    share: function() {
        this.doShare({chu: this.chu});
    },
    /**
        Open this chus authors profile
    */
    showUser: function() {
        if (App.checkConnection()) {
            var user = new chuisy.models.User(this.chu.get("user"));
            this.doShowUser({user: user});
        }
    },
    showCommentUser: function(sender, event) {
        if (App.checkConnection()) {
            var user = new chuisy.models.User(this.chu.comments.at(event.index).get("user"));
            this.doShowUser({user: user});
        }
    },
    postResize: function() {
        this.$.contentScroller.applyStyle("height", (this.$.contentContainer.getBounds().height + 500) + "px");
        this.arrangeImage();
    },
    toggleVisibility: function() {
        var visibility = this.chu.get("visibility") == "public" ? "private" : "public";
        this.chu.save({visibility: visibility});
        if (App.isSignedIn()) {
            chuisy.closet.syncRecords();
        }
    },
    adjustShareControls: function() {
        this.$.visibilityButton.addRemoveClass("public", this.chu.get("visibility") == "public");
        this.$.sharePanels.setIndex(this.chu.get("visibility") == "public" ? 1 : 0);
    },
    getMessage: function() {
        var loc = this.chu.get("location");
        if (loc && loc.name) {
            return $L("Check out this cool product I found at {{ place }}!").replace("{{ place }}", loc.name);
        } else {
            return $L("Check out this cool product!");
        }
    },
    checkSynced: function() {
        if (this.chu.get("url") && this.chu.get("image")) {
            return true;
        } else {
            navigator.notification.alert($L("You can't do this right now because the Chu still being uploaded. Please try again in a little while!"), function() {}, $L("Hold your horses!"), $L("OK"));
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
        if (App.checkConnection() && this.checkSynced()) {
            var params = {
                method: "feed",
                display: "popup",
                link: this.getShareUrl(),
                picture: this.chu.get("image")
            };
            FB.ui(params, function(obj) {
                console.log(obj);
            });
        }
    },
    /**
        Open twitter share dialog
    */
    twitter: function() {
        if (App.checkConnection() && this.checkSynced()) {
            var text = this.getMessage();
            var url = this.getShareUrl();
            window.location = this.twitterUrl + "?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url) + "&via=Chuisy";
        }
    },
    /**
        Open pinterest share dialog
    */
    pinterest: function() {
        if (App.checkConnection() && this.checkSynced()) {
            var url = this.getShareUrl();
            var media = this.chu.get("image");
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
    toggleFriends: function() {
        this.$.friendsSlider.toggleMinMax();
    },
    friendsOpened: function() {
        this.$.friendsButton.addClass("active");
        this.$.peoplePicker.setSelectedItems(this.chu.get("friends") || []);
        this.$.doneButton.setContent($L("done"));
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
        if (this.isNew) {
            enyo.Signals.send("onShowGuide", {view: "chu"});
        }
        enyo.asyncMethod(this, function() {
            this.$.contentScroller.scrollToTop();
        });
    },
    deactivate: function() {
        this.blurredByTap = false;
        this.$.image.setSrc("assets/images/chu_image_placeholder.png");
        this.$.friendsSlider.setValue(this.$.friendsSlider.getMax());
        this.friendsClosed();
    },
    errorIconTapped: function() {
        navigator.notification.confirm($L("Sorry, we couldn't upload your Chu just now. Please try again later!"), enyo.bind(this, function(choice) {
            if (choice == 1) {
                chuisy.closet.syncRecords();
            }
        }), $L("Upload failed"), [$L("Try again"), $L("OK")].join(","));
    },
    moreComments: function() {
        this.$.moreCommentsButton.hide();
        this.$.commentsSpinner.show();
        this.chu.comments.fetchNext();
    },
    showLikes: function() {
        this.$.panels.setIndex(1);
    },
    likesBack: function() {
        this.$.panels.setIndex(0);
    },
    components: [
        {kind: "Panels", arrangerKind: "CarouselArranger", classes: "enyo-fill", components: [
            {classes: "enyo-fill", components: [
                // IMAGE LOADING INDICATOR
                {kind: "onyx.Spinner", name: "spinner", classes: "chuview-spinner"},
                // IMAGEVIEW
                {kind: "Scroller", name: "imageScroller", thumb: false, classes: "chuview-image-scroller", components: [
                    {classes: "chuview-image-container", components: [
                        {kind: "Image", name: "image", classes: "chuview-image"}
                    ]}
                ]},
                // CONTROLS
                {kind: "FittableRows", name: "controls", classes: "chuview-controls enyo-fill", components: [
                    // HEADER
                    {classes: "header", components: [
                        {kind: "onyx.Button", ontap: "done", classes: "back-button", name: "doneButton"},
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
                                {classes: "chuview-like-button", name: "likeButton", ontap: "likeButtonTapped", components: [
                                    {classes: "chuview-like-button-side back"},
                                    {classes: "chuview-like-button-side front"}
                                ]},
                                {classes: "chuview-error-icon", name: "errorIcon", ontap: "errorIconTapped"}
                            ]},
                            {classes: "chuview-content", components: [
                                // CATEGORY, PRICE, COMMENTS, LIKES
                                {classes: "chuview-comments-likes-price", components: [
                                    // {classes: "chuview-category-icon", name: "categoryIcon", showing: false},
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
                                {name: "likesContainer", ontap: "showLikes", components: [
                                    {classes: "chuview-separator", components: [
                                        {classes: "chuview-separator-line"},
                                        {classes: "chuview-separator-icon chuview-likes-icon", style: "position: relative; top: 2px;"},
                                        {classes: "chuview-separator-line"}
                                    ]},
                                    {kind: "onyx.Spinner", classes: "chuview-likes-spinner", name: "likesSpinner", showing: false},
                                    {kind: "Repeater", classes: "chuview-likes", name: "likesRepeater", onSetupItem: "setupLike", components: [
                                        {kind: "Image", name: "likeImage", classes: "chuview-like-image"}
                                    ]},
                                    {classes: "chuview-likes-more", name: "moreLikes"}
                                ]},
                                {classes: "chuview-separator", components: [
                                    {classes: "chuview-separator-line"},
                                    {classes: "chuview-separator-icon chuview-comments-icon", style: "position: relative; top: 2px;"},
                                    {classes: "chuview-separator-line"}
                                ]},
                                {kind: "onyx.Button", classes: "chuview-more-comments", content: "Load more comments...", name: "moreCommentsButton", ontap: "moreComments"},
                                {kind: "onyx.Spinner", classes: "chuview-comments-spinner", name: "commentsSpinner", showing: false},
                                // COMMENTS
                                {kind: "FlyweightRepeater", classes: "chuview-comments", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                                    {classes: "chuview-comment", name: "comment", components: [
                                        {components: [
                                            {kind: "Image", name: "commentAvatar", classes: "chuview-comment-avatar", ontap: "showCommentUser"}
                                        ]},
                                        {classes: "chuview-comment-content", components: [
                                            {name: "commentText", classes: "chuview-comment-text"},
                                            {style: "text-align: right", components: [
                                                {classes: "chuview-comment-footnote", content: " - "},
                                                {classes: "chuview-comment-footnote", name: "commentFullName", ontap: "showCommentUser"},
                                                {classes: "chuview-comment-footnote", content: ", "},
                                                {classes: "chuview-comment-footnote", name: "commentTime"}
                                            ]}
                                        ]}
                                    ]}
                                ]},
                                {style: "height: 500px"}
                            ]}
                        ]},
                        {kind: "Slideable", name: "friendsSlider", unit: "%", min: 0, max: 100, value: 100, axis: "v",
                            classes: "chuview-friends-slider", overMoving: false, onAnimateFinish: "friendsSliderAnimateFinish", components: [
                            {kind: "Panels", classes: "enyo-fill", name: "friendsPanels", animate: false, draggable: false, components: [
                                {kind: "FittableRows", components: [
                                    {kind: "PeoplePicker", fit: true, onChange: "friendsChangedHandler"},
                                    {classes: "chuview-friends-hint", content: $L("Select the people on Chuisy you want to share this Chu with!")}
                                ]},
                                {style: "padding: 80px 8px;", components: [
                                    {classes: "placeholder-image chuview-friends-placeholder-image"},
                                    {classes: "chuview-friends-hint", style: "padding: 20px 40px;", content: $L("Oh no! You don't have any friends on Chuisy yet! Friends are people you follow that follow you back.")},
                                    {kind: "onyx.Button", content: $L("Invite Friends"), style: "width: 100%", ontap: "doInviteFriends"}
                                ]}
                            ]}
                        ]}
                    ]},
                    // COMMENT INPUT
                    {kind: "onyx.InputDecorator", classes: "chuview-commentinput-decorator", alwaysLooksFocused: true, components: [
                        {kind: "onyx.TextArea", name: "commentInput", placeholder: $L("Enter comment..."), onkeydown: "commentInputKeydown"},
                        {kind: "onyx.Button", classes: "chuview-commentinput-button", content: $L("send"), ontap: "commentEnter"}
                    ]}
                ]},
                {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
            ]},
            {kind: "FittableRows", style: "overflow: hidden;", classes: "enyo-fill", components: [
                {classes: "header", components: [
                    {kind: "onyx.Button", ontap: "likesBack", classes: "back-button", content: $L("back")}
                ]},
                {kind: "UserList", name: "likesList", fit: true}
            ]}
        ]}
    ]
});