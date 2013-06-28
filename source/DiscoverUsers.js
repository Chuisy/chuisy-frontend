enyo.kind({
    name: "DiscoverUsers",
    kind: "FittableRows",
    events: {
        onBack: ""
    },
    handlers: {
        onflick: "flick"
    },
    create: function() {
        this.inherited(arguments);
        this.trendingUsers = new chuisy.models.UserCollection();
        this.users = new chuisy.models.UserCollection();
        this.currentColl = this.trendingUsers;
        this.$.userList.setUsers(this.currentColl);
        this.$.userList.setScrollerOffset(35);
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
    activate: function() {
        this.$.userList.show();
        this.resized();
    },
    deactivate: function() {
        this.$.userList.hide();
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
            {classes: "header-text", content: $L("People")}
        ]},
        {classes: "alert error discover-alert", name: "noInternet", content: $L("No internet connection available!")},
        // SEARCH INPUT
        {kind: "SearchInput", classes: "discover-searchinput scrollaway", onEnter: "searchInputEnter", onCancel: "searchInputCancel", disabled: false},
        {kind: "Spinner", name: "spinner", classes: "next-page-spinner rise"},
        {name: "noResults", classes: "discover-no-results absolute-center", content: $L("No People found."), showing: false},
        {kind: "UserList", name: "userList", fit: true}
    ]
});