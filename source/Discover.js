enyo.kind({
    name: "Discover",
    classes: "discover",
    kind: "FittableRows",
    events: {
        onUserSelected: "",
        onChuSelected: ""
    },
    setupUser: function(sender, event) {
        var user = this.users[event.index];
        this.$.userListItem.setUser(user);

        var isLastItem = event.index == this.users.length-1;
        if (isLastItem && !this.allPagesLoaded("user")) {
            this.$.userNextPage.show();
            this.nextPage("user");
        } else {
            this.$.userNextPage.hide();
        }

        return true;
    },
    setupChu: function(sender, event) {
        var chu = this.chus[event.index];
        this.$.resultChuImage.applyStyle("background-image", "url(" + (chu.thumbnails["300x300"] || chu.image || "assets/images/chu_placeholder.png") + ")");
        this.$.chuAvatar.setSrc(chu.user.profile.avatar_thumbnail || "");
        this.$.categoryIcon.applyStyle("background-image", "url(assets/images/category_" + chu.product.category.name + ".png)");

        var isLastItem = event.index == this.chus.length-1;
        if (isLastItem && !this.allPagesLoaded("chu")) {
            this.$.chuNextPage.show();
            this.nextPage("chu");
        } else {
            this.$.chuNextPage.hide();
        }
        return true;
    },
    userTap: function(sender, event) {
        this.doUserSelected({user: this.users[event.index]});
    },
    chuTap: function(sender, event) {
        this.doChuSelected({chu: this.chus[event.index]});
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
        this.refreshResults("user", {objects: [], total_count: ""});
        this.refreshResults("chu", {objects: [], total_count: ""});
    },
    search: function(resource, query) {
        this.refreshResults(resource, "loading");
        chuisy[resource].search({q: query, limit: 20}, enyo.bind(this, function(sender, response) {
            if (response.meta.query == this.latestQuery) {
                this.refreshResults(resource, response);
            }
        }));
    },
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
    refreshResults: function(resource, response) {
        if (response == "loading") {
            this.$[resource + "List"].setCount(0);
            this.$[resource + "Spinner"].show();
            this.$[resource + "Spinner"].start();
            this.$[resource + "NoResults"].hide();
        } else {
            this[resource + "Meta"] = response.meta;
            this[resource + "s"] = response.objects;
            this.$[resource + "Count"].setContent(response.meta.total_count);
            this.$[resource + "Spinner"].hide();
            this.$[resource + "Spinner"].stop();
            this.$[resource + "List"].setCount(this[resource + "s"].length);
            this.$[resource + "NoResults"].setShowing(!this[resource + "s"].length);
        }
        this.$[resource + "List"].refresh();
    },
    allPagesLoaded: function(resource) {
        var meta = this[resource + "Meta"];
        return meta.offset + meta.limit >= meta.total_count;
    },
    components: [
        {kind: "SearchInput", classes: "discover-searchinput", onChange: "searchInputChange", onCancel: "searchInputCancel", style: "width: 100%;", disabled: false},
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
        {kind: "Panels", fit: true, name: "resultPanels", draggable: false, animate: false, components: [
            {classes: "discover-result-panel", components: [
                {kind: "List", classes: "enyo-fill", name: "userList", onSetupItem: "setupUser", rowsPerPage: 20, components: [
                    {kind: "UserListItem", ontap: "userTap"},
                    {name: "userNextPage", content: "Loading...", classes: "discover-nextpage"}
                ]},
                {kind: "onyx.Spinner", classes: "onyx-light discover-result-spinner absolute-center", name: "userSpinner", showing: false},
                {name: "userNoResults", classes: "discover-no-results absolute-center", content: "No users found."}
            ]},
            {classes: "discover-result-panel", components: [
                {kind: "List", classes: "enyo-fill", name: "chuList", onSetupItem: "setupChu", rowsPerPage: 20, components: [
                    {kind: "onyx.Item", name: "resultChu", classes: "discover-resultchu", ontap: "chuTap", components: [
                        {classes: "discover-resultchu-image", name: "resultChuImage", components: [
                            {kind: "Image", classes: "discover-resultchu-avatar", name: "chuAvatar"},
                            {classes: "discover-resultchu-category", name: "categoryIcon"}
                        ]}
                    ]},
                    {name: "chuNextPage", content: "Loading...", classes: "discover-nextpage"}
                ]},
                {kind: "onyx.Spinner", classes: "onyx-light discover-result-spinner absolute-center", name: "chuSpinner", showing: false},
                {name: "chuNoResults", classes: "discover-no-results absolute-center", content: "No chus found."}
            ]}
        ]}
    ]
});