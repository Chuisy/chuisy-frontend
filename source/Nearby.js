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
    components: [
        {classes: "header", components: [
            {kind: "Button", ontap: "doBack", classes: "header-button left", content: $L("back")},
            {classes: "header-text", content: $L("Nearby Stores")}
        ]},
        {kind: "StoreMap", fit: true}
    ]
});