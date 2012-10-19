ImageFilter = {
    clean: function (options) {
        cordova.exec("ImageFilter.clean");
    },
    none: function (done, options) {
        var defaults = {
            image: '',
            save: ''
        };
        for(var key in defaults) {
            if(typeof options[key] !== "undefined") defaults[key] = options[key];
        }

        return cordova.exec(done,null, "ImageFilter", "none", [defaults]);
    },
    sunnySide: function (done, options) {
        var defaults = {
            image: '',
            save: ''
        };
        for(var key in defaults) {
            if(typeof options[key] !== "undefined") defaults[key] = options[key];
        }
        return cordova.exec(done,null, "ImageFilter", "sunnySide", [defaults]);
    },
    worn: function (done, options) {
        var defaults = {
            image: '',
            save: ''
        };
        for(var key in defaults) {
            if(typeof options[key] !== "undefined") defaults[key] = options[key];
        }
        return cordova.exec(done, null, "ImageFilter", "worn", [defaults]);
    },
    vintage: function (done, options) {
        var defaults = {
            image: '',
            save: ''
        };
        for(var key in defaults) {
            if(typeof options[key] !== "undefined") defaults[key] = options[key];
        }
        return cordova.exec(done, null, "ImageFilter", "vintage", [defaults]);
    },
    stark: function (done, options) {
        var defaults = {
            image: '',
            save: ''
        };
        for(var key in defaults) {
            if(typeof options[key] !== "undefined") defaults[key] = options[key];
        }
        return cordova.exec(done, null, "ImageFilter", "stark", [defaults]);
    }
};