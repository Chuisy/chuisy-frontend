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
    scrollerOffset: 20,
    twitterUrl: "http://twitter.com/share/",
    pinterestUrl: "http://pinterest.com/pin/create/button/",
    friends: [],
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        this.setupFriends();
        this.listenTo(chuisy.accounts, "all", this.setupFriends);
        var s = this.$.contentScroller.getStrategy().$.scrollMath;
        if (s) {
            s.kDragDamping = 0.2;
            s.kSnapFriction = 0.4;
        }
    },
    setupFriends: function() {
        var user = chuisy.accounts.getActiveUser();
        if (user) {
            this.$.peoplePicker.setItems(user.friends.models);
            this.listenTo(user.friends, "all", function() {
                this.$.peoplePicker.setItems(user.friends.models);
            });
        }
    },
    loaded: function() {
        this.$.spinner.hide();
        this.arrangeImage();
    },
    chuChanged: function() {
        this.updateView();
        this.refreshComments();
        this.stopListening();
        this.listenTo(this.chu, "change", this.updateView);
        this.$.commentsCount.setContent(this.chu.get("comments_count") || 0);
        this.listenTo(this.chu.comments, "reset add remove", this.refreshComments);
        if (this.chu.get("url")) {
            this.chu.comments.fetch();
        }
    },
    updateView: function() {
        var user = this.chu.get("user");
        var loc = this.chu.get("location");

        var image = this.chu.get("localImage") || this.chu.get("thumbnails")["300x300"] || this.chu.get("image") || "assets/images/chu_placeholder.png";
        if (image != this.$.image.src) {
            this.$.spinner.show();
            this.$.image.setSrc(image);
        }

        this.$.avatar.setSrc(user && user.profile.avatar_thumbnail ? user.profile.avatar_thumbnail : "assets/images/avatar_thumbnail_placeholder.png");
        this.$.fullName.setContent(user ? (user.first_name + " " + user.last_name) : "");
        this.$.location.setContent(loc && loc.place ? loc.place.name : "");
        this.$.headerText.setContent("#" + this.chu.id);
        this.$.time.setContent(this.chu.getTimeText());

        var currFmt = new enyo.g11n.NumberFmt({style: "currency", currency: this.chu.get("price_currency")});
        this.$.price.setContent(this.chu.get("price") ? currFmt.format(this.chu.get("price")) : "");

        this.addRemoveClass("owned", this.isOwned());

        this.setLiked(this.chu.get("liked"));
        this.$.likesCount.setContent(this.chu.get("likes_count") || 0);

        this.adjustShareControls();
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
        this.chu.toggleLike();
    },
    refreshComments: function() {
        this.$.commentsCount.setContent(this.chu.comments.length || this.chu.get("comments_count") || 0);
        this.$.commentsRepeater.setCount(this.chu.comments.length);
        this.$.commentsRepeater.render();
    },
    setupComment: function(sender, event) {
        var comment = this.chu.comments.at(event.index);
        this.$.commentText.setContent(comment.get("text"));
        this.$.commentAvatar.setSrc(comment.get("user").profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
        this.$.commentFullName.setContent(comment.get("user").first_name + " " + comment.get("user").last_name);
        this.$.commentTime.setContent(comment.getTimeText());

        var isLastItem = event.index == this.chu.comments.length-1;
        if (isLastItem && this.chu.comments.hasNextPage()) {
            // Last item in the list and there is more! Load next page
            this.$.loadingNextPage.show();
            this.chu.comments.fetchNext();
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
            if (App.isSignedIn()) {
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
            var attrs = {
                text: this.$.commentInput.getValue(),
                user: chuisy.accounts.getActiveUser().toJSON()
            };
            this.chu.comments.create(attrs, {at: 0});

            this.$.commentInput.setValue("");

            // Remove focus from comment input
            this.$.commentInput.hasNode().blur();
        }
    },
    online: function() {
        if (this.chu) {
            this.chu.comments.fetch();
        }
    },
    offline: function() {
    },
    pushNotification: function() {
        // Received a push notification. Let's see whats new.
        this.chu.fetch();
        this.chu.comments.fetch();
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
            this.doShowUser({user: this.chu.get("user")});
        }
    },
    showCommentUser: function(sender, event) {
        if (App.checkConnection()) {
            var user = this.comments.at(event.index).get("user");
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
    },
    adjustShareControls: function() {
        this.$.visibilityButton.addRemoveClass("public", this.chu.get("visibility") == "public");
        this.$.sharePanels.setIndex(this.chu.get("visibility") == "public" ? 1 : 0);
    },
    getMessage: function() {
        var loc = this.chu.get("location");
        if (loc && loc.place) {
            return $L("Check out this cool product I found at {{ place }}!").replace("{{ place }}", loc.place.name);
        } else {
            return $L("Check out this cool product!");
        }
    },
    checkSynced: function() {
        if (this.chu.get("url") && this.chu.get("image")) {
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
            this.friendsChanged = false;
        }
    },
    friendsChangedHandler: function() {
        this.friendsChanged = true;
    },
    friendsSliderAnimateFinish: function() {
        this.friendsSliderOpen = this.$.friendsSlider.getValue() == this.$.friendsSlider.getMin();
        if (this.friendsSliderOpen) {
            this.friendsOpened();
        } else {
            this.friendsClosed();
        }
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
        this.$.image.setSrc("assets/images/chu_image_placeholder.png");
        this.closeFriends();
    },
    components: [
        // IMAGE LOADING INDICATOR
        {kind: "onyx.Spinner", name: "spinner", classes: "chuview-spinner"},
        // IMAGEVIEW
        {kind: "Scroller", name: "imageScroller", thumb: false, classes: "chuview-image-scroller", components: [
            {classes: "chuview-image-container", components: [
                {kind: "Image", name: "image", classes: "chuview-image"}
            ]}
        ]},
        // {kind: "ImageView", classes: "chuview-imageview enyo-fill", preventDragPropagation: true, touchOverscroll: true,
        //     onscroll: "imageScroll", src: "assets/images/chu_image_placeholder.png"},
        // {classes: "chuview-cancel-fullscreen-button", ontap: "showControls"},
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
                        ]}
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
                {kind: "Slideable", name: "friendsSlider", unit: "%", min: 0, max: 100, value: 100, axis: "v",
                    classes: "chuview-friends-slider", overmoving: false, onAnimateFinish: "friendsSliderAnimateFinish", components: [
                    {kind: "PeoplePicker", classes: "enyo-fill", onChange: "friendsChangedHandler"}
                ]}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
    ]
});