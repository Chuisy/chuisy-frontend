/**
    _Discover_ is a kind for discovering chus e.g. via search
*/
enyo.kind({
    name: "Discover",
    classes: "discover",
    kind: "FittableRows",
    events: {
        onShowDiscoverUsers: "",
        onShowDiscoverChus: "",
        onShowDiscoverStores: ""
    },
    deactivate: function() {
    },
    activate: function() {
        enyo.Signals.send("onShowGuide", {view: "discover"});
        this.$.storeMap.loadStores();
    },
    components: [
        // TABS FOR SWITCHING BETWEEN CHUS AND USERS
        {classes: "discover-tabs", components: [
            {classes: "discover-tab", ontap: "doShowDiscoverChus", content: $L("Chus")},
            {classes: "discover-tab", ontap: "doShowDiscoverStores", content: $L("Stores")},
            {classes: "discover-tab", ontap: "doShowDiscoverUsers", content: $L("People")}
        ]},
        {kind: "StoreMap", fit: true}
    ]
});