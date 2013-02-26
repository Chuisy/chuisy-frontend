enyo.kind({
    name: "ChuWebView",
    classes: "chuwebview",
    published: {
        chu: null,
        liked: false
    },
    listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
    create: function() {
        this.inherited(arguments);
        this.loadFacebookSdk();
        this.chuChanged();
    },
    loadFacebookSdk: function() {
        window.fbAsyncInit = enyo.bind(this, function() {
            console.log("sdk loaded.");
            // init the FB JS SDK
            FB.init({
                appId      : '180626725291316', // App ID from the App Dashboard
                status     : true, // check the login status upon init?
                cookie     : true, // set sessions cookies to allow your server to access the session?
                xfbml      : true  // parse XFBML tags on this page?
            });
        });

        (function(d, debug){
            console.log("loading sdk...");
            var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement('script'); js.id = id; js.async = true;
            js.src = "http://connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";
            ref.parentNode.insertBefore(js, ref);
        }(document, false));
    },
    signIn: function() {
        // Get facebook access token
        FB.login(enyo.bind(this, function(response) {
            chuisy.signIn(response.authResponse.accessToken, enyo.bind(this, function() {
                if (this.signInSuccessCallback) {
                    this.signInSuccessCallback();
                    this.signInSuccessCallback = null;
                    this.signInFailureCallback = null;
                }
            }), enyo.bind(this, function() {
                alert("Signin failed! Please try again later!");
            }), {scope: "user_birthday,user_location,user_about_me,user_website,email"});
        }));
    },
    chuChanged: function() {
        if (!this.chu) {
            return;
        }
        this.updateView();
        this.refreshComments();
        this.stopListening();
        this.listenTo(this.chu, "change", this.updateView);
        this.$.commentsCount.setContent(this.chu.get("comments_count") || 0);
        this.listenTo(this.chu.comments, "sync", this.refreshComments);
        this.loadComments();
    },
    updateView: function() {
        if (!this.chu) {
            return;
        }
        var user = this.chu.get("user");
        var loc = this.chu.get("location");

        this.$.image.setSrc(this.chu.get("image") || "assets/images/chu_placeholder.png");

        this.$.avatar.setSrc(user && user.profile && user.profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
        var fullName = user ? (user.first_name + " " + user.last_name) : "";
        this.$.fullName.setContent(fullName);
        this.$.avatar.setAttribute("title", fullName);
        this.$.location.setContent(loc && loc.name || "");
        this.$.location2.setContent(loc && loc.name || "");
        // this.$.time.setContent(this.chu.getTimeText());

        var currFmt = new enyo.g11n.NumberFmt({style: "currency", currency: this.chu.get("price_currency")});
        var priceText = this.chu.get("price") ? currFmt.format(this.chu.get("price")) : "";
        this.$.price.setContent(priceText);
        this.$.price2.setContent(priceText);

        this.setLiked(this.chu.get("liked"));
        this.$.likesCount.setContent(this.chu.get("likes_count") || 0);
    },
    likedChanged: function() {
        this.addRemoveClass("liked", this.liked);
        this.$.likeButton.addRemoveClass("active", this.liked);
        this.$.likeButton2.addRemoveClass("active", this.liked);
    },
    requestSignIn: function(params) {
        this.signInSuccessCallback = params.success;
        this.signInFailureCallback = params.failure;
        var text = $L("Please connect with your Facebook account so the owner of this Chu can know who this " + params.action + " came from!");
        this.$.signInText.setContent(text);
        this.$.signInDialog.show();
    },
    likeButtonTapped: function() {
        var user = chuisy.accounts.getActiveUser();
        if (user && user.isAuthenticated()) {
            this.toggleLike();
        } else {
            this.requestSignIn({
                success: enyo.bind(this, this.toggleLike),
                action: "like"
            });
        }
    },
    toggleLike: function(sender, event) {
        this.chu.toggleLike();
    },
    refreshComments: function() {
        var totalCount = this.chu.comments.meta && this.chu.comments.meta.total_count || this.chu.get("comments_count") || 0;
        this.$.commentsSpinner.hide();
        this.$.moreComments.setShowing(this.chu.comments.hasNextPage());
        this.$.moreComments.setContent($L("{count} more comments...").replace("{count}", totalCount - this.chu.comments.length));
        this.$.commentsCount.setContent(totalCount);
        this.$.commentsRepeater.setCount(this.chu.comments.length);
        this.$.commentsRepeater.render();
    },
    loadComments: function() {
        this.$.moreComments.hide();
        this.$.commentsSpinner.show();
        this.chu.comments.fetch({data: {limit: 5}});
    },
    setupComment: function(sender, event) {
        var comment = this.chu.comments.at(event.index);
        this.$.commentText.setContent(comment.get("text"));
        this.$.commentAvatar.setSrc(comment.get("user").profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
        this.$.commentFullName.setContent(comment.get("user").first_name + " " + comment.get("user").last_name);
        this.$.commentTime.setContent(comment.getTimeText());
    },
    commentInputKeydown: function(sender, event) {
        if (event.keyCode == 13) {
            // The enter key was pressed. Post the comment.
            this.commentEnter();
            event.preventDefault();
        }
    },
    commentEnter: function() {
        var user = chuisy.accounts.getActiveUser();
        if (user && user.isAuthenticated()) {
            this.postComment();
        } else {
            this.$.commentInput.hasNode().blur();
            // User is not signed in yet. Prompt him to do so before he can comment
            this.requestSignIn({
                success: enyo.bind(this, this.postComment),
                action: "comment"
            });
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
            this.chu.comments.create(attrs);
            this.refreshComments();
            this.$.commentInput.setValue("");
        }
    },
    hideSignInDialog: function() {
        this.$.signInDialog.hide();
    },
    moreComments: function() {
        this.$.moreComments.hide();
        this.$.commentsSpinner.show();
        this.chu.comments.fetchNext();
    },
    components: [
        {classes: "header", components: [
            {classes: "chuwebview-header-logo"}
        ]},
        {classes: "chuwebview-body", components: [
            {classes: "chuwebview-info", components: [
                {classes: "chuwebview-avatar-name", components: [
                    {kind: "Image", name: "avatar", classes: "chuwebview-avatar"},
                    {classes: "chuwebview-fullname ellipsis", name: "fullName", showing: false}
                ]},
                {classes: "chuwebview-likes-comments", components: [
                    {classes: "chuwebview-likes-icon"},
                    {name: "likesCount", classes: "chuwebview-likes-count"},
                    {classes: "chuwebview-comments-icon"},
                    {name: "commentsCount", classes: "chuwebview-comments-count"}
                ]},
                {classes: "chuwebview-price", name: "price", showing: false},
                {classes: "chuwebview-location", name: "location", showing: false},
                {name: "likeButton", ontap: "likeButtonTapped", classes: "chuwebview-like-button", showing: false}
            ]},
            {classes: "chuwebview-image-container", components: [
                {style: "width: 100%", components: [
                    {kind: "Image", name: "image", classes: "chuwebview-image"},
                    {classes: "chuwebview-like-overlay", components: [
                        {name: "likeButton2", ontap: "likeButtonTapped", classes: "chuwebview-like-button"},
                        {classes: "chuwebview-price", name: "price2"},
                        {classes: "chuwebview-location", name: "location2"}
                    ]}
                ]}
            ]},
            {classes: "chuwebview-comments", components: [
                {classes: "chuwebview-more-comments", content: "Load more comments...", name: "moreComments", ontap: "moreComments"},
                {kind: "onyx.Spinner", classes: "chuwebview-comments-spinner", name: "commentsSpinner", showing: false},
                {kind: "FlyweightRepeater", classes: "chuwebview-comments-repeater", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                    {classes: "chuwebview-comment", name: "comment", components: [
                        {components: [
                            {kind: "Image", name: "commentAvatar", classes: "chuwebview-comment-avatar", ontap: "showCommentUser"}
                        ]},
                        {classes: "chuwebview-comment-content", components: [
                            {classes: "chuwebview-comment-time", name: "commentTime"},
                            {classes: "chuwebview-comment-fullname ellipsis", name: "commentFullName", ontap: "showCommentUser"},
                            {name: "commentText", classes: "chuwebview-comment-text"}
                        ]}
                    ]}
                ]},
                {kind: "onyx.InputDecorator", classes: "chuwebview-commentinput-decorator", alwaysLooksFocused: true, components: [
                    {kind: "onyx.TextArea", name: "commentInput", placeholder: "Enter comment...", onkeydown: "commentInputKeydown"}
                ]}
            ]}
        ]},
        {kind: "onyx.Popup", classes: "chuwebview-signin-dialog", name: "signInDialog", floating: true, centered: true, components: [
            {classes: "chuwebview-signin-text", name: "signInText"},
            {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
                {classes: "facebook-button-icon"},
                {content: $L("Sign In With Facebook")}
            ]},
            {classes: "chuwebview-signin-cancel-button", ontap: "hideSignInDialog"}
        ]}
    ]
});