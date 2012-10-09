enyo.kind({
    name: "ChuboxItemView",
    classes: "chuboxitemview",
    kind: "FittableColumns",
    published: {
        item: null,
        user: null,
        likeable: false,
        liked: false,
        chu: null
    },
    events: {
        onRemove: ""
    },
    currencies: {
        "USD": "$",
        "EUR": "€",
        "GBP": "£"
    },
    create: function() {
        this.inherited(arguments);
        this.likeableChanged();
        this.itemChanged();
        this.userChanged();
    },
    itemChanged: function() {
        if (this.item) {
            this.$.name.setContent(this.item.product.name);
            this.$.price.setContent(this.currencies[this.item.product.price_currency] + this.item.product.price);
            this.$.description.setContent(this.item.product.description);
            this.$.image1.setSrc(this.item.product.image_1);
            this.$.image2.setSrc(this.item.product.image_2);
            this.$.image3.setSrc(this.item.product.image_3);

            if (this.item.liked) {
                this.setLiked(true);
                this.likeId = this.item.liked;
            } else {
                this.setLiked(false);
            }

            this.$.likeCount.setContent(this.item.likes.length + " likes");
            this.refreshLikerRepeater();
            
            this.addRemoveClass("owned", this.isOwned());
        }
    },
    userChanged: function() {
        this.addRemoveClass("owned", this.isOwned());
    },
    chuChanged: function() {
        this.addRemoveClass("owned", this.isOwned());
        this.log(this.isOwned());
    },
    isOwned: function() {
        return this.user && this.item && this.user.id == this.item.user.id;
    },
    likeableChanged: function() {
        this.addRemoveClass("likeable", this.likeable);
    },
    likedChanged: function() {
        this.addRemoveClass("liked", this.liked);
        this.$.likeButton.addRemoveClass("active", this.liked);
    },
    remove: function(sender, event) {
        this.doRemove(event);
        return true;
    },
    collect: function(sender, event) {
        var data = {
            product: this.item.product.resource_uri,
            user: this.user.resource_uri
        };
        chuisy.chuboxitem.create(data, enyo.bind(this, function(sender, response) {
            this.log(response);
        }));
        return true;
    },
    toggleLike: function(sender, event) {
        this.$.likeButton.setDisabled(true);
        if (this.liked) {
            chuisy.like.remove(this.likeId, enyo.bind(this, function(sender, response) {
                // this.setLiked(false);
                this.item.liked = false;
                // Remove this user's like from the likes array.
                for (var i=0; i<this.item.likes.length; i++) {
                    if (this.item.likes[i].user.id == this.user.id) {
                        this.item.likes.remove(i);
                        break;
                    }
                }
                this.itemChanged();
                this.$.likeButton.setDisabled(false);
            }));
        } else {
            var likeData = {
                item: this.item.resource_uri,
                user: this.user.resource_uri,
                chu: this.chu.resource_uri
            };
            chuisy.like.create(likeData, enyo.bind(this, function(sender, response) {
                // this.setLiked(true);
                this.item.liked = response.id;
                this.item.likes.push(response);
                this.itemChanged();
                this.$.likeButton.setDisabled(false);
            }));
        }
        return true;
    },
    refreshLikerRepeater: function() {
        this.$.likerRepeater.setCount(Math.min(this.item.likes.length, 10));
    },
    setupLiker: function(sender, event) {
        var user = this.item.likes[event.index].user;
        event.item.$.likerImage.setSrc(user.profile.avatar);
    },
    components: [
        {kind: "Scroller", fit: true, components: [
            {classes: "main-content", components: [
                {classes: "pageheader", components: [
                    {classes: "pageheader-title", name: "name"},
                    {classes: "chuboxitemview-price", name: "price"}
                ]},
                {classes: "chuboxitemview-description", name: "description"},
                {classes: "chuboxitemview-likes", components: [
                    {name: "likeCount"},
                    {kind: "Repeater", name: "likerRepeater", classes: "chuboxitemview-likerrepeater", onSetupItem: "setupLiker", components: [
                        {kind: "Image", name: "likerImage", classes: "chuboxitemview-likerimage"}
                    ]},
                    {kind: "onyx.Button", name: "likeButton", content: "Like", ontap: "toggleLike"}
                ]},
                {kind: "onyx.Button", content: "Put in Chubox!", ontap: "collect", classes: "chuboxitemview-collect-button"},
                {kind: "Image", name: "image1", classes: "chuboxitemview-productimage"},
                {kind: "Image", name: "image2", classes: "chuboxitemview-productimage"},
                {kind: "Image", name: "image3", classes: "chuboxitemview-productimage"}
            ]}
        ]}
    ]
});