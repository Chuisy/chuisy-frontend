enyo.kind({
    name: "Gifts",
    activate: function() {},
    deactivate: function() {},
    components: [
        {classes: "gifts-placeholder", name: "placeholder", components: [
            {classes: "gifts-placeholder-image"},
            {classes: "gifts-placeholder-text", content: "Coming soon..."}
        ]}
    ]
});