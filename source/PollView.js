enyo.kind({
    name: "ChuView",
    kind: "FittableRows",
    classes: "chuview",
    published: {
        chu: null
    },
    events: {
        onBack: "",
        onItemSelected: ""
    },
    userChanged: function(sender, event) {
        this.user = event.user;
        this.applyPermissions();
    },
    chuChanged: function() {
        if (this.chu) {
            this.chu.votes = this.chu.votes || [];
            this.$.title.setContent(this.chu.title);
            this.$.avatar.setSrc(this.chu.user.profile.avatar_thumbnail);
            this.$.username.setContent(this.chu.user.username);
            this.$.headerText.setContent("#" + this.chu.id);
            this.applyPermissions();
            this.refreshComments();

            for (var i=0; i<4; i++) {
                this.setupItem(i);
            }

            this.$.carousel.setIndex(1);
            this.$.pageThumb1.setActive(true);

            this.digestVotes();
        }
    },
    setupItem: function(index) {
        var view = this.$["chuItemView" + index];
        var thumb = this.$["pageThumb" + (index + 2)];
        var itemComp = this.$["chuItem" + index];
        var itemImage = this.$["chuItemImage" + index];
        var item = this.chu.items[index];
        if (item) {
            view.setItem(item);
            view.setChu(this.chu);
            view.setVotes();
            view.show();
            itemImage.setSrc(item.thumbnails["100x100"]);
            itemComp.show();
            // thumb.applyStyle("background-image", "url(" + item.thumbnails["100x100"] + ")");
            thumb.show();
        } else {
            view.hide();
            thumb.hide();
            itemComp.hide();
        }
    },
    digestVotes: function() {
        var itemVotes = [];
        for (var i=0; i<this.chu.items.length; i++) {
            var item = this.chu.items[i];
            var votes = [];
            for (var j=0; j<this.chu.votes.length; j++) {
                var vote = this.chu.votes[j];
                if (vote.item == item.resource_uri) {
                    votes.push(vote);
                    if (vote.user.id == this.user.id) {
                        this.$["chuItem" + i].setActive(true);
                        // this.$["chuItemView" + i].setVotedFor(true);
                    }
                }
            }
            itemVotes.push(votes);
        }
        for (var k=0; k<itemVotes.length; k++) {
            this.$["chuItemView" + k].setVotes(itemVotes[k]);
        }
    },
    isOwned: function() {
        return !this.chu || this.user && this.chu.user.id == this.user.profile.id;
    },
    applyPermissions: function() {
        var owned = this.isOwned();
        this.addRemoveClass("owned", owned);
    },
    clear: function() {
        this.chu = null;
        this.chuChanged();
    },
    closeChu: function() {
        this.chu.closed = true;
        this.updateChu(enyo.bind(this, function() {
            this.doBack();
        }));
    },
    refreshComments: function() {
        this.$.commentsRepeater.setCount(this.chu ? this.chu.comments.length : 0);
        this.$.commentsRepeater.render();
    },
    setupComment: function(sender, event) {
        var comment = this.chu.comments[event.index];
        this.$.commentText.setContent(comment.text);
        this.$.commentAvatar.setSrc(comment.user.profile.avatar_thumbnail);
    },
    commentInputKeydown: function(sender, event) {
        if (event.keyCode == 13) {
            this.commentEnter();
        }
    },
    commentEnter: function() {
        var comment = {
            text: this.$.commentInput.getValue(),
            chu: this.chu.resource_uri,
            user: this.user
        };
        this.chu.comments.push(comment);
        var params = enyo.clone(comment);
        delete params.user;
        chuisy.chucomment.create(params, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
        this.refreshComments();
        this.$.commentInput.setValue("");
    },
    showComments: function() {
        this.$.carousel.setIndex(0);
    },
    carouselTransitionStart: function(sender, event) {
        this.$["pageThumb" + event.toIndex].setActive(true);
    },
    itemTap: function(sender, event) {
        sender.setActive(true);
        this.voteFor(this.chu.items[sender.index]);
    },
    groupActivate: function(sender, event) {
        var itemComp = event.originator;
        this.$["chuItemView" + itemComp.index].setVotedFor(itemComp.getActive());
    },
    chuItemViewVote: function(sender, event) {
        this.$["chuItem" + sender.itemIndex].setActive(true);
        this.voteFor(this.chu.items[sender.itemIndex]);
    },
    voteFor: function(item) {
        chuisy.vote.create({
            chu: this.chu.resource_uri,
            item: item.resource_uri
        }, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
        this.updateVote(item);
    },
    updateVote: function(item) {
        for (var i=0; i<this.chu.votes.length; i++) {
            var vote = this.chu.votes[i];
            if (vote.user.id == this.user.id) {
                vote.item = item.resource_uri;
            }
        }
        this.digestVotes();
    },
    openItem: function(sender, event) {
        this.doItemSelected(event);
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
            {classes: "mainheader-text", content: "chuisy", name: "headerText"},
            {kind: "onyx.Button", classes: "chuview-comments-button", ontap: "showComments", name: "commentsButton", components: [
                {kind: "Image", src: "assets/images/comment_light.png"}
            ]}
        ]},
        {fit: true, style: "position: relative", components: [
            {kind: "Panels", name: "carousel", arrangerKind: "CarouselArranger", classes: "enyo-fill", onTransitionStart: "carouselTransitionStart", components: [
                {classes: "enyo-fill", components: [
                    // COMMENTS
                    {kind: "Scroller", classes: "chuview-comments-scroller", components: [
                        {kind: "FlyweightRepeater", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                            {kind: "onyx.Item", classes: "chuview-comment", components: [
                                {kind: "Image", name: "commentAvatar", classes: "miniavatar chuview-comment-avatar"},
                                {name: "commentText", classes: "chuview-comment-text"}
                            ]}
                        ]}
                    ]},
                    // POST COMMENT
                    {kind: "onyx.InputDecorator", classes: "chuview-commentinput-decorator", components: [
                        {kind: "onyx.TextArea", name: "commentInput", placeholder: "Enter comment...", onkeydown: "commentInputKeydown"}
                    ]}
                ]},
                {kind: "Scroller", classes: "enyo-fill", components: [
                    {classes: "chuview-header", components: [
                        // AVATAR
                        {kind: "Image", name: "avatar", classes: "miniavatar chuview-avatar"},
                        // USERNAME
                        {name: "username", classes: "chuview-username ellipsis"},
                        // TITLE
                        {classes: "chuview-title", name: "title"}
                    ]},
                    // // CLOSE
                    // {style: "text-align: center; padding: 10px;", components: [
                    //     {kind: "onyx.Button", name: "closeButton", classes: "chuview-close-button onyx-negative", content: "Close Chu", ontap: "closeChu"}
                    // ]},
                    // ITEMS
                    {style: "text-align: center;", components: [
                        {kind: "Group", onActivate: "groupActivate", components: [
                            {kind: "GroupItem", index: 0, classes: "chuitem", ontap: "itemTap", name: "chuItem0", components: [
                                {kind: "Image", classes: "chuitem-image", name: "chuItemImage0"}
                            ]},
                            {kind: "GroupItem", index: 1, classes: "chuitem", ontap: "itemTap", name: "chuItem1", components: [
                                {kind: "Image", classes: "chuitem-image", name: "chuItemImage1"}
                            ]},
                            {kind: "GroupItem", index: 2, classes: "chuitem", ontap: "itemTap", name: "chuItem2", components: [
                                {kind: "Image", classes: "chuitem-image", name: "chuItemImage2"}
                            ]},
                            {kind: "GroupItem", index: 3, classes: "chuitem", ontap: "itemTap", name: "chuItem3", components: [
                                {kind: "Image", classes: "chuitem-image", name: "chuItemImage3"}
                            ]}
                        ]}
                    ]}
                ]},
                {kind: "ChuItemView", itemIndex: 0, classes: "enyo-fill", name: "chuItemView0", onVote: "chuItemViewVote", onOpenItem: "openItem"},
                {kind: "ChuItemView", itemIndex: 1, classes: "enyo-fill", name: "chuItemView1", onVote: "chuItemViewVote", onOpenItem: "openItem"},
                {kind: "ChuItemView", itemIndex: 2, classes: "enyo-fill", name: "chuItemView2", onVote: "chuItemViewVote", onOpenItem: "openItem"},
                {kind: "ChuItemView", itemIndex: 3, classes: "enyo-fill", name: "chuItemView3", onVote: "chuItemViewVote", onOpenItem: "openItem"}
            ]}
        ]},
        {classes: "chuview-pageindicator", components: [
            {kind: "Group", components: [
                {kind: "GroupItem", classes: "chuview-pageindicator-item info", name: "pageThumb0"},
                {kind: "GroupItem", classes: "chuview-pageindicator-item overview", name: "pageThumb1"},
                {kind: "GroupItem", classes: "chuview-pageindicator-item itemthumb", name: "pageThumb2"},
                {kind: "GroupItem", classes: "chuview-pageindicator-item itemthumb", name: "pageThumb3"},
                {kind: "GroupItem", classes: "chuview-pageindicator-item itemthumb", name: "pageThumb4"},
                {kind: "GroupItem", classes: "chuview-pageindicator-item itemthumb", name: "pageThumb5"}
            ]}
        ]},
        {kind: "Signals", onUserChanged: "userChanged"}
    ]
});