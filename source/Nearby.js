/**
    _Nearby_ shows nearby stores
*/
enyo.kind({
    name: "Nearby",
    classes: "nearby",
    kind: "FittableRows",
    events: {
        onBack: ""
    },
    loadStores: function() {
        this.$.storeMap.loadStores();
    },
    activate: function() {
        this.$.storeMap.show();
        this.resized();
    },
    deactivate: function() {
        this.$.storeMap.hide();
    },
    components: [
        {classes: "header", components: [
            {classes: "header-icon back", ontap: "doBack"},
            {classes: "header-text", content: $L("Nearby Stores")}
        ]},
        {kind: "StoreMap", fit: true}
    ]
});