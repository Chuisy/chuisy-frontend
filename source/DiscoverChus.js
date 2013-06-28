enyo.kind({
    name: "DiscoverChus",
    kind: "FittableRows",
    events: {
        onBack: ""
        // onShowChu: ""
    },
    handlers: {
        onflick: "flick"
    },
    create: function() {
        this.inherited(arguments);
        this.trendingChus = new chuisy.models.ChuCollection();
        this.chus = new chuisy.models.ChuCollection();
        this.currentColl = this.trendingChus;
        this.$.list.setChus(this.currentColl);
        this.$.list.setScrollerOffset(35);
        // this.chus.on("sync", _.bind(this.synced, this, "chu"));
        // this.trendingChus.on("sync", _.bind(this.synced, this, "chu"));
    },
    // setupChu: function(sender, event) {
    //     var chu = this.currentColl.at(event.index);
    //     var image = chu.get("thumbnails") && chu.get("thumbnails")["300x100"] || chu.get("image") || "assets/images/chu_placeholder.png";
    //     this.$.resultChuImage.applyStyle("background-image", "url(" + image + ")");
    //     this.$.chuAvatar.setSrc(chu.get("user").profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");
    //     var isLastItem = event.index == this.currentColl.length-1;
    //     if (isLastItem && this.currentColl.hasNextPage()) {
    //         // Item is last item in the list but there is more! Load next page.
    //         this.$.nextPageSpacer.show();
    //         this.nextPage();
    //     } else {
    //         this.$.nextPageSpacer.hide();
    //     }
    //     App.sendCubeEvent("impression", {
    //         chu: chu,
    //         context: "discover"
    //     });
    //     return true;
    // },
    // nextPage: function() {
    //     this.$.spinner.addClass("rise");
    //     this.currentColl.fetchNext({success: enyo.bind(this, this.refresh), data: {thumbnails: ["300x100"]}});
    // },
    // chuTap: function(sender, event) {
    //     this.doShowChu({chu: this.currentColl.at(event.index)});
    //     event.preventDefault();
    // },
    // refresh: function(coll, response, request, force) {
    //     if (force || request && request.data && request.data.q == this.latestQuery) {
    //         this.$.spinner.removeClass("rise");
    //         this.$.noResults.setShowing(!coll.length);
    //         this.$.list.setCount(coll.length);
    //         if (this.currentColl == coll && coll.meta && coll.meta.offset) {
    //             this.currentColl = coll;
    //             this.$.list.refresh();
    //         } else {
    //             this.currentColl = coll;
    //             this.$.list.reset();
    //         }
    //     }
    // },
    refresh: function(coll, response, request, force) {
        if (force || request && request.data && request.data.q == this.latestQuery) {
            this.$.spinner.removeClass("rise");
            this.$.noResults.setShowing(!coll.length);
            if (coll != this.currentColl) {
                this.$.list.setChus(coll);
            }
            this.currentColl = coll;
        }
    },
    searchInputEnter: function() {
        var query = this.$.searchInput.getValue();

        if (query) {
            this.$.searchInput.blur();
            this.search(query);
            App.sendCubeEvent("search", {
                context: "chus",
                query: query
            });
        } else {
            this.searchInputCancel();
        }
    },
    search: function(query) {
        // We are waiting for the search response. Unload list and show spinner.
        this.chus.reset();
        this.refresh(this.chus, null, null, true);
        this.$.spinner.addClass("rise");
        this.$.noResults.hide();
        this.latestQuery = query;
        this.chus.fetch({searchQuery: query, data: {thumbnails: ["100x100"], limit: 21}, success: enyo.bind(this, this.refresh)});
    },
    searchInputCancel: function() {
        this.latestQuery = null;
        this.chus.reset();
        this.chus.meta = {};
        this.refresh(this.trendingChus, null, null, true);
    },
    loadTrending: function() {
        this.trendingChus.fetch({data: {thumbnails: ["100x100"], limit: 21}, success: enyo.bind(this, this.refresh)});
    },
    activate: function() {
        this.$.list.show();
        this.resized();
    },
    deactivate: function() {
        this.$.list.hide();
    },
    online: function() {
        this.$.noInternet.removeClass("show");
        this.$.searchInput.removeClass("disabled");
        return true;
    },
    offline: function() {
        this.$.noInternet.addClass("show");
        this.$.searchInput.addClass("disabled");
        return true;
    },
    flick: function(sender, event) {
        this.$.searchInput.addRemoveClass("hide", event.yVelocity < 0);
    },
    components: [
        {kind: "Signals", ononline: "online", onoffline: "offline"},
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", content: $L("Chus")}
        ]},
        {classes: "alert error discover-alert", name: "noInternet", content: $L("No internet connection available!")},
        // SEARCH INPUT
        {kind: "SearchInput", classes: "discover-searchinput scrollaway", onEnter: "searchInputEnter", onCancel: "searchInputCancel",
        placeholder: $L("Search for people and stores...")},
        {kind: "Spinner", name: "spinner", classes: "next-page-spinner rise"},
        {name: "noResults", classes: "discover-no-results absolute-center", content: $L("No Chus found."), showing: false},
        // {kind: "List", fit: true, name: "list", onSetupItem: "setupChu", rowsPerPage: 20,
        //     strategyKind: "TransitionScrollStrategy", thumb: false, components: [
        //     {kind: "onyx.Item", name: "resultChu", classes: "discover-resultchu", ontap: "chuTap", components: [
        //         {classes: "discover-resultchu-image", name: "resultChuImage", components: [
        //             {kind: "Image", classes: "discover-resultchu-avatar", name: "chuAvatar"},
        //             {classes: "category-icon discover-resultchu-category", name: "categoryIcon"}
        //         ]}
        //     ]},
        //     {name: "nextPageSpacer", classes: "next-page-spacer"}
        // ]}
        {kind: "ChuList", fit: true, name: "list"}
    ]
});