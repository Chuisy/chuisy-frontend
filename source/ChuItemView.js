enyo.kind({
    name: "ChuItemView",
    classes: "chuitemview",
        published: {
        item: null,
        user: null,
        votedFor: false,
        votes: [],
        chu: null
    },
    events: {
        onVote: "",
        onOpenItem: ""
    },
    currencies: {
        "USD": "$",
        "EUR": "€",
        "GBP": "£"
    },
    create: function() {
        this.inherited(arguments);
        this.itemChanged();
        this.userChanged();
    },
    itemChanged: function() {
        if (this.item) {
            // this.$.name.setContent(this.item.product.name);
            this.$.price.setContent(this.currencies[this.item.product.price_currency] + this.item.product.price);
            // this.$.description.setContent(this.item.product.description);
            this.$.image.setSrc(this.item.image);
            this.$.locationText.setContent(this.item.location && this.item.location.place ? this.item.location.place.name + ", " + this.item.location.place.address : "");
            this.addRemoveClass("owned", this.isOwned());
        }
    },
    userChanged: function() {
        this.addRemoveClass("owned", this.isOwned());
    },
    chuChanged: function() {
        this.addRemoveClass("owned", this.isOwned());
    },
    votedForChanged: function() {
        this.addRemoveClass("votedfor", this.votedFor);
        this.$.voteButton.setDisabled(this.votedFor);
    },
    votesChanged: function() {
        if (this.votes) {
            this.$.votesCount.setContent(this.votes.length);
            this.refreshVotesRepeater();
        }
    },
    refreshVotesRepeater: function() {
        this.$.votesRepeater.setCount(this.votes.length);
        this.$.votesRepeater.build();
    },
    setupVote: function(sender, event) {
        var vote = this.votes[event.index];
        event.item.$.voterImage.setSrc(vote.user.profile.avatar_thumbnail);
        return true;
    },
    isOwned: function() {
        return this.user && this.item && this.user.id == this.item.user.id;
    },
    vote: function() {
        this.setVotedFor(true);
        this.doVote({item: this.item});
    },
    openItem: function() {
        this.doOpenItem({item: this.item});
    },
    // collect: function(sender, event) {
    //     var data = {
    //         product: this.item.product.resource_uri,
    //         user: this.user.resource_uri
    //     };
    //     chuisy.chuboxitem.create(data, enyo.bind(this, function(sender, response) {
    //         this.log(response);
    //     }));
    //     return true;
    // },
    // toggleLike: function(sender, event) {
    //     this.$.likeButton.setDisabled(true);
    //     if (this.liked) {
    //         chuisy.like.remove(this.likeId, enyo.bind(this, function(sender, response) {
    //             // this.setLiked(false);
    //             this.item.liked = false;
    //             // Remove this user's like from the likes array.
    //             for (var i=0; i<this.item.likes.length; i++) {
    //                 if (this.item.likes[i].user.id == this.user.id) {
    //                     this.item.likes.remove(i);
    //                     break;
    //                 }
    //             }
    //             this.itemChanged();
    //             this.$.likeButton.setDisabled(false);
    //         }));
    //     } else {
    //         var likeData = {
    //             item: this.item.resource_uri,
    //             user: this.user.resource_uri,
    //             chu: this.chu.resource_uri
    //         };
    //         chuisy.like.create(likeData, enyo.bind(this, function(sender, response) {
    //             // this.setLiked(true);
    //             this.item.liked = response.id;
    //             this.item.likes.push(response);
    //             this.itemChanged();
    //             this.$.likeButton.setDisabled(false);
    //         }));
    //     }
    //     return true;
    // },
    components: [
        {kind: "Scroller", classes: "enyo-fill", components: [
            {kind: "Image", name: "image", classes: "chuitemview-productimage"},
            {classes: "narrowchuview-section", components: [
                {style: "height: 35px", components: [
                    {name: "votesCount", classes: "chuitemview-votescount"},
                    {kind: "Repeater", name: "votesRepeater", classes: "chuitemview-votesrepeater", onSetupItem: "setupVote", components: [
                        {kind: "Image", name: "voterImage", classes: "miniavatar"}
                    ]}
                ]},
                {components: [
                    {kind: "onyx.Button", name: "voteButton", ontap: "vote", classes: "chuitemview-vote-button", content: "vote"},
                    {kind: "onyx.Button", ontap: "openItem", classes: "chuitemview-goto-button", content: "go to"}
                ]},
                {classes: "chuitemview-location-text", name: "locationText"},
                {classes: "chuitemview-price", name: "price"}
            ]}
        ]}
    ]
});