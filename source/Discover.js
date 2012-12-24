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
    handlers: {
        ontap: "tapHandler"
    },
    setupUser: function(sender, event) {
        var user = this.users[event.index];
        this.$.userListItem.setUser(user);

        var isLastItem = event.index == this.users.length-1;
        if (isLastItem && !this.allPagesLoaded("user")) {
            // Item is last item in the list but there is more! Load next page.
            this.$.userNextPage.show();
            this.nextPage("user");
        } else {
            this.$.userNextPage.hide();
        }

        return true;
    },
    setupChu: function(sender, event) {
        var chu = this.chus[event.index];
        this.$.resultChuImage.applyStyle("background-image", "url(" + (chu.thumbnails["300x100"] || chu.image || "assets/images/chu_placeholder.png") + ")");
        this.$.chuAvatar.setSrc(chu.user.profile.avatar_thumbnail || "");
        this.$.categoryIcon.applyStyle("background-image", "url(assets/images/category_" + chu.product.category.name + ".png)");

        var isLastItem = event.index == this.chus.length-1;
        if (isLastItem && !this.allPagesLoaded("chu")) {
            // Item is last item in the list but there is more! Load next page.
            this.$.chuNextPage.show();
            this.nextPage("chu");
        } else {
            this.$.chuNextPage.hide();
        }
        return true;
    },
    userTap: function(sender, event) {
        this.doShowUser({user: this.users[event.index]});
        event.preventDefault();
    },
    chuTap: function(sender, event) {
        this.doShowChu({chu: this.chus[event.index]});
        event.preventDefault();
    },
    radioGroupActivate: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.resultPanels.setIndex(event.originator.index);
        }
    },
    searchInputChange: function() {
        var query = this.$.searchInput.getValue();

        this.latestQuery = query;
        this.search("user", query);
        this.search("chu", query);
    },
    searchInputCancel: function() {
        this.latestQuery = null;
        this.refreshResults("user", {objects: [], meta: {total_count: ""}});
        this.refreshResults("chu", {objects: [], meta: {total_count: ""}});
        this.$.resultPanels.setIndex(0);
    },
    /**
        Searches the _resource_ for a _query_
    */
    search: function(resource, query) {
        this.refreshResults(resource, "loading");
        chuisy[resource].search({q: query, limit: 20}, enyo.bind(this, function(sender, response) {
            // Only update results if the response is the one from the latest query
            if (response.meta.query == this.latestQuery) {
                this.refreshResults(resource, response);
            }
        }));
    },
    /**
        Loads next page for a _resource_
    */
    nextPage: function(resource) {
        var meta = this[resource + "Meta"];
        var objects = this[resource + "s"];
        var params = {
            q: meta.query,
            limit: meta.limit,
            offset: meta.offset + meta.limit
        };
        chuisy[resource].search(params, enyo.bind(this, function(sender, response) {
            response.objects = objects.concat(response.objects);
            this.refreshResults(resource, response);
        }));
    },
    /**
        Update the results lists for _resource_ with the result data from _response_.
    */
    refreshResults: function(resource, response) {
        if (response == "loading") {
            // We are waiting for the search response. Unload list and show spinner.
            this.$[resource + "List"].setCount(0);
            this.$[resource + "Spinner"].show();
            this.$[resource + "Spinner"].start();
            this.$[resource + "NoResults"].hide();
        } else {
            // Got a response! Update meta data, fill the result list and hide the spinner
            this[resource + "Meta"] = response.meta;
            this[resource + "s"] = response.objects;
            this.$[resource + "Count"].setContent(response.meta.total_count);
            this.$[resource + "Spinner"].hide();
            this.$[resource + "Spinner"].stop();
            this.$[resource + "List"].setCount(this[resource + "s"].length);
            this.$[resource + "NoResults"].setShowing(!this[resource + "s"].length);
        }
        this.$[resource + "List"].refresh();
        this.$.resultPanels.setIndex(this.$.resultPanels.getIndex() || 1);
    },
    /**
        Checks if all items have been loaded for a given _resource_
    */
    allPagesLoaded: function(resource) {
        var meta = this[resource + "Meta"];
        return meta.offset + meta.limit >= meta.total_count;
    },
    tapHandler: function(sender, event) {
        // Remove focus from search input if the user taps outside of it
        if (!event.originator.isDescendantOf(this.$.searchInput)) {
            this.$.searchInput.blur();
        }
    },
    deactivate: function() {
        this.$.searchInput.blur();
    },
    activate: function() {},
    components: [
        // SEARCH INPUT
        {kind: "SearchInput", classes: "discover-searchinput", onChange: "searchInputChange", onCancel: "searchInputCancel", style: "width: 100%;", disabled: false},
        // TABS FOR SWITCHING BETWEEN CHUS AND USERS
        {kind: "onyx.RadioGroup", classes: "discover-tabs", onActivate: "radioGroupActivate", components: [
            {index: 0, active: true, components: [
                {classes: "discover-tab-caption", content: "Users"},
                {classes: "discover-tab-count", name: "userCount"}
            ]},
            {index: 1, components: [
                {classes: "discover-tab-caption", content: "Chus"},
                {classes: "discover-tab-count", name: "chuCount"}
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
                {kind: "List", classes: "enyo-fill", name: "userList", onSetupItem: "setupUser", rowsPerPage: 20, components: [
                    {kind: "UserListItem", ontap: "userTap"},
                    {name: "userNextPage", content: "Loading...", classes: "loading-next-page"}
                ]},
                {kind: "onyx.Spinner", classes: "onyx-light discover-result-spinner absolute-center", name: "userSpinner", showing: false},
                {name: "userNoResults", classes: "discover-no-results absolute-center", content: "No users found."}
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
                    {name: "chuNextPage", content: "Loading...", classes: "loading-next-page"}
                ]},
                {kind: "onyx.Spinner", classes: "onyx-light discover-result-spinner absolute-center", name: "chuSpinner", showing: false},
                {name: "chuNoResults", classes: "discover-no-results absolute-center", content: "No chus found."}
            ]}
        ]}
    ]
});