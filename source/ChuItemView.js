enyo.kind({
    name: "ChuItemView",
    classes: "chuitemview",
        published: {
        item: null,
        user: null,
        liked: false,
        chu: null
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
            // this.$.price.setContent(this.currencies[this.item.product.price_currency] + this.item.product.price);
            // this.$.description.setContent(this.item.product.description);
            this.$.image1.setSrc(this.item.product.image_1);
            this.$.image2.setSrc(this.item.product.image_2);
            this.$.image3.setSrc(this.item.product.image_3);

            if (this.item.liked) {
                this.setLiked(true);
                this.likeId = this.item.liked;
            } else {
                this.setLiked(false);
            }

            this.$.likeCount.setContent(this.item.likes.length);
            this.refreshLikerRepeater();
            
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
        return this.user && this.item && this.user.id == this.item.user.id;
    },
    likedChanged: function() {
        this.addRemoveClass("liked", this.liked);
        this.$.likeButton.addRemoveClass("active", this.liked);
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
        {kind: "Scroller", classes: "enyo-fill", components: [
            {classes: "narrowchuview-section", components: [
                {style: "height: 35px", components: [
                    {kind: "Image", src: "assets/images/favorite.png"},
                    {name: "likeCount", classes: "chuitemview-likecount"},
                    {kind: "Repeater", name: "likerRepeater", classes: "chuitemview-likerrepeater", onSetupItem: "setupLiker", components: [
                        {kind: "Image", name: "likerImage", classes: "miniavatar"}
                    ]}
                ]},
                {components: [
                    {kind: "onyx.Button", name: "likeButton", ontap: "toggleLike", classes: "chuitemview-like-button", components: [
                        {kind: "Image", name: "heartImage", src: "assets/images/favorite_light.png"},
                        {style: "display: inline;", content: "like"}
                    ]},
                    {kind: "onyx.Button", name: "collectButton", ontap: "collect", classes: "chuitemview-collect-button", components: [
                        {kind: "Image", name: "chuboxImage", src: "assets/images/archive.png"},
                        {style: "display: inline;", content: "put in chubox"}
                    ]}
                ]}
            ]},
            {kind: "Image", name: "image1", classes: "chuitemview-productimage"},
            {kind: "Image", name: "image2", classes: "chuitemview-productimage"},
            {kind: "Image", name: "image3", classes: "chuitemview-productimage"}
        ]}
    ]
});