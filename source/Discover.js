/**
    _Discover_ is a kind for discovering chus e.g. via search
*/
enyo.kind({
    name: "Discover",
    classes: "discover",
    kind: "FittableRows",
    events: {
        // An avatar or username has been tapped
        onShowUser: "",
        // A chu has been selected
        onShowChu: ""
    },
    create: function() {
        this.inherited(arguments);

        this.users = new chuisy.models.UserCollection();
        this.chus = new chuisy.models.ChuCollection();

        this.$.userList.setUsers(this.users);

        this.users.on("sync", _.bind(this.synced, this, "user"));
        this.chus.on("sync", _.bind(this.synced, this, "chu"));
    },
    setupChu: function(sender, event) {
        var chu = this.chus.at(event.index);
        this.$.resultChuImage.applyStyle("background-image", "url(" + (chu.get("thumbnails")["300x100"] || chu.get("image") || "assets/images/chu_placeholder.png") + ")");
        this.$.chuAvatar.setSrc(chu.get("user").profile.avatar_thumbnail || "assets/images/avatar_thumbnail_placeholder.png");

        var isLastItem = event.index == this.chus.length-1;
        if (isLastItem && this.chus.hasNextPage()) {
            // Item is last item in the list but there is more! Load next page.
            this.$.chuNextPage.show();
            this.chus.fetchNext();
        } else {
            this.$.chuNextPage.hide();
        }
        return true;
    },
    chuTap: function(sender, event) {
        this.doShowChu({chu: this.chus.at(event.index)});
        event.preventDefault();
    },
    radioGroupActivate: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.resultPanels.setIndex(event.originator.index);
        }
    },
    searchInputChange: function() {
        var query = this.$.searchInput.getValue();

        if (query) {
            this.latestQuery = query;
            this.search("user", query);
            this.search("chu", query);
        } else {
            this.searchInputCancel();
        }
    },
    searchInputCancel: function() {
        this.latestQuery = null;
        this.users.reset();
        this.chus.reset();
        this.users.meta = {};
        this.chus.meta = {};
        this.synced("user", null, null, true);
        this.synced("chu", null, null, true);
        this.$.resultPanels.setIndex(0);
        this.$.resultTabs.setActive(null);
    },
    synced: function(which, collection, options, force) {
        if (force || options && options.data && options.data.q == this.latestQuery) {
            var coll = this[which + "s"];
            this.$[which + "Count"].show();
            this.$[which + "Count"].setContent(coll.meta.total_count);
            this.$[which + "Spinner"].hide();
            this.$[which + "NoResults"].setShowing(!coll.length);
            if (!this.$.resultPanels.getIndex()) {
                this.$.resultPanels.setIndex(1);
            }

            if (which == "chu") {
                this.$.chuList.setCount(coll.length);
                this.$.chuList.refresh();
            }
        }
    },
    /**
        Searches the _which_ for a _query_
    */
    search: function(which, query) {
        // We are waiting for the search response. Unload list and show spinner.
        this[which + "s"].reset();
        this.synced(which, null, null, true);
        this.$[which + "Spinner"].show();
        this.$[which + "Count"].hide();
        this.$[which + "NoResults"].hide();
        this.latestQuery = query;
        this[which + "s"].fetch({searchQuery: query});
    },
    deactivate: function() {
        this.$.searchInput.blur();
    },
    activate: function() {
        enyo.Signals.send("onShowGuide", {view: "discover"});
    },
    components: [
        // SEARCH INPUT
        {style: "padding: 5px; box-sizing: border-box;", components: [
            {kind: "SearchInput", classes: "discover-searchinput", onChange: "searchInputChange", onCancel: "searchInputCancel", style: "width: 100%;", disabled: false}
        ]},
        // TABS FOR SWITCHING BETWEEN CHUS AND USERS
        {kind: "onyx.RadioGroup", name: "resultTabs", classes: "discover-tabs", onActivate: "radioGroupActivate", components: [
            {index: 1, name: "userTab", components: [
                {classes: "discover-tab-caption", content: "Users"},
                {classes: "discover-tab-count", name: "userCount"},
                {classes: "onyx-spinner tiny", name: "userSpinner", showing: false}
            ]},
            {index: 2, name: "chuTab", components: [
                {classes: "discover-tab-caption", content: "Chus"},
                {classes: "discover-tab-count", name: "chuCount"},
                {classes: "onyx-spinner tiny", name: "chuSpinner", showing: false}
            ]}
        ]},
        // RESULTS
        {kind: "Panels", fit: true, name: "resultPanels", draggable: false, animate: false, components: [
            // PLACEHOLDER
            {classes: "discover-result-panel", components: [
                {classes: "discover-placeholder absolute-center", name: "placeholder"}
            ]},
            // USERS
            {classes: "discover-result-panel", components: [
                {kind: "UserList", classes: "enyo-fill", name: "userList", rowsPerPage: 20},
                {name: "userNoResults", classes: "discover-no-results absolute-center", content: $L("No users found.")}
            ]},
            // CHUS
            {classes: "discover-result-panel", components: [
                {kind: "List", classes: "enyo-fill", name: "chuList", onSetupItem: "setupChu", rowsPerPage: 20, components: [
                    {kind: "onyx.Item", name: "resultChu", classes: "discover-resultchu", ontap: "chuTap", components: [
                        {classes: "discover-resultchu-image", name: "resultChuImage", components: [
                            {kind: "Image", classes: "discover-resultchu-avatar", name: "chuAvatar"},
                            {classes: "category-icon discover-resultchu-category", name: "categoryIcon"}
                        ]}
                    ]},
                    {name: "chuNextPage", content: $L("Loading..."), classes: "loading-next-page"}
                ]},
                {name: "chuNoResults", classes: "discover-no-results absolute-center", content: $L("No Chus found.")}
            ]}
        ]}
    ]
});