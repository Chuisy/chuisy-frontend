enyo.kind({
    name: "ListChu",
    kind: "onyx.Item",
    tapHighlight: true,
    noStretch: true,
    classes: "listchu",
    published: {
        chu: null
    },
    chuChanged: function() {
        if (this.chu) {
            this.$.title.setContent(this.chu.title);
            this.$.username.setContent(this.chu.user.username);
            this.$.avatar.setSrc(this.chu.user.profile.avatar_thumbnail);
            this.$.image1.applyStyle("background-image", "url(" + (this.chu.items[0] ? this.chu.items[0].thumbnails["100x100"] : "") + ")");
            this.$.image2.applyStyle("background-image", "url(" + (this.chu.items[1] ? this.chu.items[1].thumbnails["100x100"] : "") + ")");
            this.$.image3.applyStyle("background-image", "url(" + (this.chu.items[2] ? this.chu.items[2].thumbnails["100x100"] : "") + ")");
        }
    },
    // refreshChuItems: function() {
    //     for (var i=0; i<3; i++) {
    //         this.setupItem(i);
    //     }
    // },
    // setupItem: function(index) {
    //     var component = this.$["item" + index];
    //     var item = this.chu.items[index];
    //     component.setItem(item);
    //     component.setShowing((item));
    // },
    components: [
        {components: [
            {style: "width: 100%; text-align: center;", components: [
                {name: "image1", classes: "listchu-image1"},
                {style: "display: inline-block;", components: [
                    {name: "image2", classes: "listchu-image2"},
                    {name: "image3", classes: "listchu-image3"}
                ]}
            ]},
            {kind: "Image", name: "avatar", classes: "miniavatar"},
            {name: "username", classes: "listchu-username ellipsis"},
            {name: "time", classes: "listchu-time", content: "1 hour ago"},
            {name: "title", classes: "listchu-title"}
        ]}
    ]
});