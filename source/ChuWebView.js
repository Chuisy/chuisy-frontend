enyo.kind({
    name: "ChuWebView",
    classes: "chuwebview",
    published: {
        chu: null,
        liked: false
    },
    currencies: {
        "USD": "$",
        "EUR": "€",
        "GBP": "£"
    },
    kind: "Scroller",
    create: function() {
        this.inherited(arguments);
        chuisy.init();
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
            chuisy.signIn({fb_access_token: response.authResponse.accessToken}, enyo.bind(this, function() {
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
        if (this.chu) {
            this.$.image.setSrc(this.chu.localImage || this.chu.image);
            this.$.avatar.setSrc(this.chu.user.profile.avatar_thumbnail);
            this.$.fullName.setContent(this.chu.user.first_name + " " + this.chu.user.last_name);
            this.$.price.setContent(this.currencies[this.chu.product.price_currency] + this.chu.product.price);
            this.$.locationText.setContent(this.chu.location && this.chu.location.place ? this.chu.location.place.name + ", " + this.chu.location.place.address : "");

            if (this.chu.liked) {
                this.setLiked(true);
                this.likeId = this.chu.liked;
            } else {
                this.setLiked(false);
            }

            this.$.likesCount.setContent(this.chu.likes_count);
            this.$.commentsCount.setContent(this.chu.comments_count);

            this.likes = [];
            this.comments = [];
            this.refreshLikes();
            this.refreshComments();

            this.loadLikes();
            this.loadComments();
            
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
    requestSignIn: function(params) {
        this.signInSuccessCallback = params.success;
        this.signInFailureCallback = params.failure;
        var text = "Please connect with your Facebook account so the owner of this Chu can know who this " + params.action + " came from!";
        this.$.signInText.setContent(text);
        this.$.signInDialog.show();
    },
    likeButtonTapped: function() {
        if (chuisy.getSignInStatus().signedIn) {
            this.toggleLike();
        } else {
            this.requestSignIn({
                success: enyo.bind(this, this.toggleLike),
                action: "like"
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
        this.$.likesCount.setContent(this.likes.length);
        this.$.likerRepeater.setCount(Math.min(this.likes.length, 10));
    },
    setupLiker: function(sender, event) {
        var user = this.likes[event.index].user;
        event.item.$.likerImage.setSrc(user.profile.avatar_thumbnail);
    },
    loadComments: function() {
        chuisy.chucomment.list([["chu", this.chu.id]], enyo.bind(this, function(sender, response) {
            this.comments = response.objects;
            this.$.commentsCount.setContent(this.comments.length);
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
        }
    },
    commentEnter: function() {
        if (chuisy.getSignInStatus().signedIn) {
            this.postComment();
        } else {
            this.requestSignIn({
                success: enyo.bind(this, this.postComment),
                action: "comment"
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
    hideSignInDialog: function() {
        this.$.signInDialog.hide();
    },
    components: [
        {classes: "header", components: [
            {classes: "chuwebview-header-logo"}
        ]},
        {classes: "chuwebview-body", components: [
            {kind: "Image", name: "image", classes: "chuwebview-image"},
            {components: [
                {kind: "Image", name: "avatar", classes: "chuwebview-avatar"},
                {classes: "chuwebview-fullname ellipsis", name: "fullName", showing: false},
                {classes: "chuwebview-likes-icon"},
                {name: "likesCount", classes: "chuwebview-likes-count"},
                {classes: "chuwebview-comments-icon"},
                {name: "commentsCount", classes: "chuwebview-comments-count"},
                {kind: "Repeater", name: "likerRepeater", classes: "chuwebview-likerrepeater", onSetupItem: "setupLiker", showing: false, components: [
                    {kind: "Image", name: "likerImage", classes: "miniavatar"}
                ]}
            ]},
            {classes: "chuwebview-price", name: "price", showing: false},
            {classes: "chuwebview-location", name: "locationText", showing: false},
            {kind: "onyx.Button", name: "likeButton", ontap: "likeButtonTapped", classes: "chuwebview-like-button", components: [
                {classes: "chuwebview-like-button-icon"}
            ]},
            {kind: "onyx.InputDecorator", classes: "chuwebview-commentinput-decorator", alwaysLooksFocused: true, components: [
                {kind: "onyx.TextArea", name: "commentInput", placeholder: "Enter comment...", onkeydown: "commentInputKeydown"}
            ]},
            {kind: "FlyweightRepeater", classes: "chuwebview-comments-repeater", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                {kind: "onyx.Item", classes: "chuwebview-comment", components: [
                    {components: [
                        {kind: "Image", name: "commentAvatar", classes: "miniavatar chuwebview-comment-avatar"},
                        {classes: "chuwebview-comment-fullname", name: "commentFullName"},
                        {classes: "chuwebview-comment-time", name: "commentTime"}
                    ]},
                    {name: "commentText", classes: "chuwebview-comment-text"}
                ]}
            ]}
        ]},
        {kind: "onyx.Popup", classes: "chuwebview-signin-dialog", name: "signInDialog", floating: true, centered: true, components: [
            {classes: "chuwebview-signin-text", name: "signInText"},
            {kind: "onyx.Button", name: "facebookButton", classes: "facebook-button", ontap: "signIn", components: [
                {classes: "facebook-button-icon"},
                {content: "Sign In With Facebook"}
            ]},
            {classes: "chuwebview-signin-cancel-button", ontap: "hideSignInDialog"}
        ]},
        {kind: "Signals", onUserChanged: "userChanged", ononline: "online", onoffline: "offline", onPushNotification: "pushNotification"}
    ]
});