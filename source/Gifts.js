enyo.kind({
    name: "Gifts",
    classes: "gifts",
    // Meta data for loading notifications from the api
    meta: {
        limit: 20,
        offset: 0,
        total_count: 0
    },
    items: [],
    /**
        Load first batch of gifts
    */
    load: function() {
        chuisy.gift.list([], enyo.bind(this, function(sender, response) {
            this.log(response);
            this.meta = response.meta;
            this.items = response.objects;
            this.refresh();
        }), {limit: this.meta.limit});
    },
    /**
        Loads next page of gifts
    */
    nextPage: function() {
        var params = {
            limit: this.meta.limit,
            offset: this.meta.offset + this.meta.limit
        };
        chuisy.notification.list(this.filters, enyo.bind(this, function(sender, response) {
            this.meta = response.meta;
            this.items = this.items.concat(response.objects);
            this.refresh();
        }), params);
    },
    /**
        Refreshes gifts list with loaded items
    */
    refresh: function() {
        this.$.list.setCount(this.items.length);
        this.$.list.refresh();
        this.$.placeholder.setShowing(!this.items.length);
    },
    /**
        Checks if all notifications have been loaded
    */
    allPagesLoaded: function() {
        return this.meta.offset + this.meta.limit >= this.meta.total_count;
    },
    setupItem: function(sender, event) {
        var item = this.items[event.index];

        this.$.value.setContent(item.value);

        var isLastItem = event.index == this.items.length-1;
        if (isLastItem && !this.allPagesLoaded()) {
            // Last item in the list and there is more! Load next page
            this.$.loadingNextPage.show();
            this.nextPage();
        } else {
            this.$.loadingNextPage.hide();
        }

        return true;
    },
    activate: function() {
        this.load();
    },
    deactivate: function() {},
    components: [
        // {classes: "notifications-notification", style: "text-align: center; margin: 10px;", components: [
        //     {kind: "Image", src: "assets/images/Esprit.svg", style: "height: 30px; margin-bottom: 5px;"},
        //     {style: "font-size: 10pt; color: #333;", content: "Ein exklusiver Rabatt über 20% auf das Produkt, dass du gerade entdeckt hast."}
        // ]},
        // {classes: "notifications-notification", style: "text-align: center; margin: 10px;", components: [
        //     {kind: "Image", src: "assets/images/Zara_Logo.svg", style: "height: 30px; margin-bottom: 5px;"},
        //     {style: "font-size: 10pt; color: #333;", content: "Ein exklusiver Rabatt über 20% auf das Produkt, dass du gerade entdeckt hast."}
        // ]},
        // {classes: "placeholder-image", style: "margin: 0 auto;"}
        // {classes: "placeholder absolute-center", components: [
        //     {classes: "placeholder-image"},
        //     {classes: "placeholder-text", content: "Coming soon..."}
        // ]}
        {classes: "placeholder", name: "placeholder", components: [
            {classes: "placeholder-image"},
            {classes: "placeholder-text", content: "You don't have any gifts yet..."}
        ]},
        {kind: "List", classes: "enyo-fill", onSetupItem: "setupItem", components: [
            {name: "value"},
            {name: "loadingNextPage", content: "Loading...", classes: "loading-next-page"}
        ]}
    ]
});