(function(cordova) {
    window.plugins = window.plugins || {};
    window.plugins.social = {
        available: function(service, success, fail) {
            cordova.exec(success, fail, "Social", "available", [service]);
        },
        facebook: function(text, url, image, success, fail) {
            cordova.exec(success, fail, "Social", "facebook", [text, url, image]);
        },
        twitter: function(text, url, image, success, fail) {
            cordova.exec(success, fail, "Social", "twitter", [text, url, image]);
        }
    };
})(window.cordova);
