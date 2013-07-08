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
            this.$.spinner.hide();
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
        } else {
            this.searchInputCancel();
        }
    },
    search: function(query) {
        // We are waiting for the search response. Unload list and show spinner.
        this.users.reset();
        this.refresh(this.users, null, null, true);
        this.$.spinner.show();
        this.$.noResults.hide();
        this.latestQuery = query;
        this.users.fetch({searchQuery: query, success: enyo.bind(this, this.refresh)});
        App.sendCubeEvent("action", {
            type: "search",
            context: "users",
            query: query
        });
    },
    searchInputCancel: function() {
        this.latestQuery = null;
        this.users.reset();
        this.users.meta = {};
        this.refresh(this.trendingUsers, null, null, true);
    },
    loadTrending: function() {
        if (!this.trendingUsers.length) {
            this.$.spinner.show();
            this.trendingUsers.fetch({success: enyo.bind(this, this.refresh)});
        }
    },
    activate: function() {
        this.$.userList.show();
        this.resized();
        this.$.searchInput.show();
        enyo.asyncMethod(this, function() {
            this.$.searchInput.removeClass("hide");
        });
    },
    deactivate: function() {
        this.$.userList.hide();
        this.$.searchInput.hide();
        this.$.searchInput.addClass("hide");
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
        {kind: "Spinner", name: "spinner", showing: false, classes: "discover-spinner"},
        {name: "noResults", classes: "discover-no-results absolute-center", content: $L("No People found."), showing: false},
        {kind: "UserList", name: "userList", fit: true}
    ]
});