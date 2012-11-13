enyo.kind({
    name: "ChuItem",
    classes: "chuitem",
    published: {
        item: null,
        user: null,
        liked: false,
        chu: null
    },
    events: {
        onRemove: ""
    },
    create: function() {
        this.inherited(arguments);
        this.itemChanged();
        this.userChanged();
    },
    itemChanged: function() {
        if (this.item) {
            this.$.productImage.applyStyle("background-image", "url(" + this.item.product.image_1 + ")");
            if (this.item.liked) {
                this.setLiked(true);
                this.likeId = this.item.liked;
            } else {
                this.setLiked(false);
            }
            this.addRemoveClass("owned", this.isOwned());
        }
    },
    userChanged: function() {
        this.addRemoveClass("owned", this.isOwned());
    },
    chuChanged: function() {
        this.addRemoveClass("owned", this.isOwned());
    },
    isOwned: function() {
        // if (this.chu) {
        //     return this.user && this.item && this.user.id == this.chu.user.id;
        // } else {
            return this.user && this.item && this.user.id == this.item.user.id;
        // }
    },
    likedChanged: function() {
        this.addRemoveClass("liked", this.liked);
        this.$.likeButton.addRemoveClass("active", this.liked);
    },
    toggleLiked: function(sender, event) {
        if (!this.wait) {
            this.wait = true;
            if (this.liked) {
                chuisy.like.remove(this.likeId, enyo.bind(this, function(sender, response) {
                    this.setLiked(false);
                    this.wait = false;
                }));
            } else {
                var likeData = {
                    item: this.item.resource_uri,
                    user: this.user.resource_uri,
                    chu: this.chu.resource_uri
                };
                chuisy.like.create(likeData, enyo.bind(this, function(sender, response) {
                    this.setLiked(true);
                    this.likeId = response.id;
                    this.wait = false;
                }));
            }
        }
        return true;
    },
    components: [
        {name: "productImage", classes: "chuitem-image"},
        {kind: "onyx.Button", name: "likeButton", classes: "chuitem-like-button", content: "Like", ontap: "toggleLike", showing: false}
    ]
});