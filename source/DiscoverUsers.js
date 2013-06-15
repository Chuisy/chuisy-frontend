enyo.kind({
    name: "DiscoverUsers",
    kind: "FittableRows",
    events: {
        onBack: ""
    },
    create: function() {
        this.inherited(arguments);
        this.trendingUsers = new chuisy.models.UserCollection();
        this.users = new chuisy.models.UserCollection();
        this.currentColl = this.trendingUsers;
        this.$.userList.setUsers(this.currentColl);
    },
    refresh: function(coll, response, request, force) {
        if (force || request && request.data && request.data.q == this.latestQuery) {
            this.$.spinner.removeClass("rise");
            this.$.noResults.setShowing(!coll.length);
            if (coll != this.currentColl) {
                this.$.userList.setUsers(coll);
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
                context: "users",
                query: query
            });
        } else {
            this.searchInputCancel();
        }
    },
    search: function(query) {
        // We are waiting for the search response. Unload list and show spinner.
        this.users.reset();
        this.refresh(this.users, null, null, true);
        this.$.spinner.addClass("rise");
        this.$.noResults.hide();
        this.latestQuery = query;
        this.users.fetch({searchQuery: query, success: enyo.bind(this, this.refresh)});
    },
    searchInputCancel: function() {
        this.latestQuery = null;
        this.users.reset();
        this.users.meta = {};
        this.refresh(this.trendingUsers, null, null, true);
    },
    loadTrending: function() {
        this.trendingUsers.fetch({success: enyo.bind(this, this.refresh)});
    },
    unfreeze: function() {
        this.$.userList.updateMetrics();
        this.$.userList.refresh();
    },
    components: [
        {classes: "header", components: [
            {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")},
            {classes: "header-text", content: $L("People")}
        ]},
        // SEARCH INPUT
        // {style: "padding: 5px; box-sizing: border-box; box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3); position: relative; z-index: 10;", components: [
        {kind: "SearchInput", classes: "discover-searchinput", onEnter: "searchInputEnter", onCancel: "searchInputCancel", disabled: false},
        // ]},
        {kind: "Spinner", name: "spinner", classes: "next-page-spinner rise"},
        {name: "noResults", classes: "discover-no-results absolute-center", content: $L("No Chus found."), showing: false},
        {kind: "UserList", name: "userList", fit: true}
    ]
});