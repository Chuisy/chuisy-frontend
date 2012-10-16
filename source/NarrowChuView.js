enyo.kind({
    name: "NarrowChuView",
    kind: "FittableRows",
    classes: "narrowchuview",
    published: {
        user: null,
        chu: null
    },
    events: {
        onBack: "",
        onItemSelected: ""
    },
    userChanged: function() {
        this.applyPermissions();
    },
    chuChanged: function() {
        if (this.chu) {
            this.$.title.setContent(this.chu.title);
            this.$.avatar.setSrc(this.chu.user.profile.avatar);
            this.$.username.setContent(this.chu.user.username);
            this.visibility = this.chu.visibility;
            this.applyPermissions();
            this.refreshChuItems();
            this.refreshTaggedPersons();
            this.updateLocationText();
            this.refreshComments();

            for (var i=0; i<10; i++) {
                this.setupItem(i);
            }

            this.$.carousel.setIndex(1);
        }
    },
    setupItem: function(index) {
        var c = this.$["chuItemView" + index];
        var item = this.chu.items[index];
        if (item) {
            c.setItem(item);
            c.setChu(this.chu);
            c.setUser(this.user);
            c.show();
        } else {
            c.hide();
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
    openSecondarySlider: function() {
        this.$.secondarySlider.animateToMin();
    },
    closeSecondarySlider: function() {
        this.$.secondarySlider.animateToMax();
    },
    refreshTaggedPersons: function() {
        this.$.taggedRepeater.setCount(this.chu.tagged.length);
        this.$.taggedRepeater.render();
    },
    refreshChuItems: function() {
        this.$.itemRepeater.setCount(this.chu.items.length);
        this.$.itemRepeater.render();
    },
    setupTaggedPerson: function(sender, event) {
        var user = this.chu.tagged[event.index];
        event.item.$.thumbnail.setSrc(user.profile.avatar);
    },
    setupRepeaterItem: function(sender, event) {
        var item = this.chu.items[event.index];
        event.item.$.chuItem.setItem(item);
        event.item.$.chuItem.setUser(this.user);
        event.item.$.chuItem.setChu(this.chu);
    },
    itemTap: function(sender, event) {
        // var item = this.chu.items[event.index];
        // this.doItemSelected({item: item, chu: this.chu});
        sender.toggleLiked();
    },
    itemRemove: function(sender, event) {
        this.items.remove(event.index);

        if (this.chu) {
            this.chu.item = this.items;
            this.updateChu();
        }

        this.refreshChuItems();
    },
    closeChu: function() {
        this.chu.closed = true;
        this.updateChu(enyo.bind(this, function() {
            this.doBack();
        }));
    },
    updateLocationText: function() {
        this.$.locationText.setContent(this.location ? this.location.address : "No location for this Chu!");
    },
    refreshComments: function() {
        this.$.commentsRepeater.setCount(this.chu ? this.chu.comments.length : 0);
        this.$.commentsRepeater.render();
    },
    setupComment: function(sender, event) {
        var comment = this.chu.comments[event.index];
        this.$.commentText.setContent(comment.text);
        this.$.commentAvatar.setSrc(comment.user.profile.avatar);
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
        this.updateChu();
        this.refreshComments();
        this.$.commentInput.setValue("");
    },
    toggleComments: function() {
        this.$.secondarySlider.toggleMinMax();
    },
    locationPickerDrag: function() {
        // Prevent drag event to propagate to slider
        return true;
    },
    components: [
        {classes: "mainheader", content: "Chuisy", components: [
            {kind: "onyx.Button", ontap: "doBack", classes: "back-button", content: "back"},
            {classes: "mainheader-text", content: "Chuisy"},
            {kind: "onyx.Button", classes: "narrowchuview-comments-button", ontap: "toggleComments", name: "commentsButton", components: [
                {kind: "Image", src: "assets/images/comment_light.png"}
            ]}
        ]},
        {fit: true, style: "position: relative", components: [
            {kind: "Panels", name: "carousel", arrangerKind: "CarouselArranger", classes: "enyo-fill", components: [
                {kind: "FittableRows", classes: "enyo-fill", components: [
                    // SHARE
                    {classes: "narrowchuview-section", components: [
                        {classes: "narrowchuview-label", content: "Share this Chu"}
                    ]},
                    // TAGGED
                    {kind: "FittableColumns", classes: "narrowchuview-section", components: [
                        {classes: "narrowchuview-label", content: "Tagged People:"},
                        {kind: "Repeater", fit: true, name: "taggedRepeater", classes: "narrowchuview-taggedrepeater", onSetupItem: "setupTaggedPerson", components: [
                            {kind: "Image", name: "thumbnail", classes: "narrowchuview-taggedrepeater-thumbnail", ontap: "tagPerson"}
                        ]}
                    ]},
                    // LOCATION
                    {classes: "narrowchuview-section", components: [
                        {classes: "narrowchuview-location-text", name: "locationText"}
                    ]},
                    {fit: true}
                ]},
                {kind: "Scroller", classes: "enyo-fill", components: [
                    {classes: "narrowchuview-header", components: [
                        // AVATAR
                        {kind: "Image", name: "avatar", classes: "miniavatar narrowchuview-avatar"},
                        // USERNAME
                        {name: "username", classes: "narrowchuview-username"},
                        // TITLE
                        {classes: "narrowchuview-title", name: "title"}
                    ]},
                    // CLOSE
                    {style: "text-align: center; padding: 10px;", components: [
                        {kind: "onyx.Button", name: "closeButton", classes: "narrowchuview-close-button onyx-negative", content: "Close Chu", ontap: "closeChu"}
                    ]},
                    // ITEMS
                    {style: "text-align: center;", components: [
                        {kind: "Repeater", name: "itemRepeater", onSetupItem: "setupRepeaterItem", components: [
                            {kind: "ChuItem", likeable: true, ontap: "itemTap", onRemove: "itemRemove"}
                        ]}
                    ]}
                ]},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView0"},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView1"},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView2"},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView3"},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView4"},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView5"},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView6"},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView7"},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView8"},
                {kind: "ChuItemView", classes: "enyo-fill", name: "chuItemView9"}
            ]},
            {kind: "Slideable", overMoving: false, unit: "px", min: -330, max: 0, preventDragPropagation: true, classes: "secondaryslider", name: "secondarySlider", components: [
                // {kind: "Panels", name: "secondaryPanels", arrangerKind: "CardArranger", draggable: false, classes: "enyo-fill", components: [
                    {classes: "enyo-fill", components: [
                        // COMMENTS
                        {kind: "Scroller", classes: "narrowchuview-comments-scroller", components: [
                            {kind: "FlyweightRepeater", name: "commentsRepeater", onSetupItem: "setupComment", components: [
                                {kind: "onyx.Item", classes: "narrowchuview-comment", components: [
                                    {kind: "Image", name: "commentAvatar", classes: "narrowchuview-comment-avatar"},
                                    {name: "commentText", classes: "narrowchuview-comment-text"}
                                ]}
                            ]}
                        ]},
                        // POST COMMENT
                        {kind: "onyx.InputDecorator", classes: "narrowchuview-commentinput-decorator", components: [
                            {kind: "onyx.TextArea", name: "commentInput", placeholder: "Enter comment...", onkeydown: "commentInputKeydown"}
                        ]}
                    ]}
                // ]}
            ]}
        ]}
    ]
});