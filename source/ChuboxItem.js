enyo.kind({
    name: "ChuboxItem",
    classes: "chuboxitem",
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
    create: function() {
        this.inherited(arguments);
        this.likeableChanged();
        this.itemChanged();
        this.userChanged();
    },
    itemChanged: function() {
        if (this.item) {
            this.$.caption.setContent(this.item.product.name);
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
                this.setLiked(false);
                this.$.likeButton.setDisabled(false);
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
                this.$.likeButton.setDisabled(false);
            }));
        }
        return true;
    },
    components: [
        {name: "productImage", classes: "chuboxitem-image"},
        {classes: "chuboxitem-caption ellipsis", name: "caption"},
        {classes: "chuboxitem-toolbar", components: [
            {kind: "onyx.IconButton", src: "assets/images/x.png", classes: "chuboxitem-toolbar-button chuboxitem-remove-button", ontap: "remove"},
            {kind: "onyx.IconButton", src: "assets/images/chubox.png", classes: "chuboxitem-toolbar-button chuboxitem-collect-button", ontap: "collect"}
        ]},
        {kind: "onyx.Button", name: "likeButton", classes: "chuboxitem-like-button", content: "Like", ontap: "toggleLike"}
    ]
});

enyo.kind({
    name: "ListChuboxItem",
    kind: "onyx.Item",
    layoutKind: "FittableColumnsLayout",
    classes: "listchuboxitem",
    noStretch: true,
    published: {
        item: null
    },
    itemChanged: function() {
        if (this.item) {
            this.$.caption.setContent(this.item.product.name);
            this.$.productImage.applyStyle("background-image", "url(" + this.item.product.image_1 + ")");
        }
    },
    create: function() {
        this.inherited(arguments);
        this.itemChanged();
    },
    components: [
        {classes: "listchuboxitem-image", name: "productImage"},
        {classes: "listchuboxitem-caption ellipsis", name: "caption", fit: true}
    ]
});

enyo.kind({
    name: "MiniChuboxItem",
    classes: "minichuboxitem",
    published: {
        item: null
    },
    itemChanged: function() {
        if (this.item) {
            // this.$.caption.setContent(this.item.product.name);
            this.$.productImage.applyStyle("background-image", "url(" + this.item.product.image_1 + ")");
        }
    },
    create: function() {
        this.inherited(arguments);
        this.itemChanged();
    },
    components: [
        {name: "productImage", classes: "minichuboxitem-image"}
        // {classes: "minichuitem-caption ellipsis", name: "caption"}
    ]
});