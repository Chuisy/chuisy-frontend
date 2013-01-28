/*
    Compability layer around Backbone.Model and Backbone.Collection for use with django-tastypie apis
*/

(function($, _, Backbone) {
    Backbone.Tastypie = {
        authCredentials: {
            username: "martin.kleinschrodt.5",
            apiKey: "8145a9717d1710ea6e5b731deec1e88bdc584839"
        }
    };

    var addAuthentication = function(options, model) {
        // Set authorization headers to authenticate the request
        options.headers = options.headers || {};
        _.extend(options.headers, {
            'Authorization': 'ApiKey ' + Backbone.Tastypie.authCredentials.username + ':' + Backbone.Tastypie.authCredentials.apiKey
        });

        // Additionally add authentication credentials to get params for compability with tastypie < 0.9.12
        if (options.method == "read") {
            options.data = options.data || {};
            // If we're doing a GET request, we can simply include the params in the options.data object
            _.extend(options.data, {
                username: Backbone.Tastypie.authCredentials.username,
                api_key: Backbone.Tastypie.authCredentials.apiKey
            });
        } else {
            // Otherwise we have to directly add them to the url
            options.url = _.result(model, 'url') + "?username=" + Backbone.Tastypie.authCredentials.username + "&api_key=" + Backbone.Tastypie.authCredentials.apiKey;
        }

        return options;
    };

    Backbone.Tastypie.Model = Backbone.Model.extend({
        sync: function(method, model, options) {
            if (Backbone.Tastypie.authCredentials) {
                addAuthentication(options, model);
            }
            return Backbone.Model.prototype.sync.call(this, method, model, options);
        }
    });

    Backbone.Tastypie.Collection = Backbone.Collection.extend({
        initialize: function(models, options) {
            _.bindAll(this, 'fetchNext', 'fetchPrevious');
            this.meta = {};

            // These filters will be inserted into each request, unless a _filters_ option explicitly provided
            // in _fetch()_, _fetchNext()_ or _fetchPrevious()_
            this.filters = options && options.filters || this.filters || {};
        },
        sync: function(method, collection, options) {
            if (Backbone.Tastypie.authCredentials) {
                addAuthentication(options);
            }
            return Backbone.Collection.prototype.sync.call(this, method, collection, options);
        },
        parse: function(response) {
            // Remember meta data for pagination
            if (response && response.meta) {
                this.meta = response.meta;
            }

            return response && response.objects || response;
        },
        fetch: function(options) {
            options = options || {};

            options.data = options.data || {};
            var filters = options.filters || this.filters || {};

            if (typeof(filters) == "function") {
                filters = filters();
            }

            // Add filters to params. If _filters_ options is not explicitly provided, use filters provided
            // at initialization if any.
            _.extend(options.data, filters);
            return Backbone.Collection.prototype.fetch.call(this, options);
        },
        /*
            Fetch next page and add it to the collection
        */
        fetchNext: function(options) {
            if (!this.meta) {
                console.error("Got no meta data. Can't load next page!");
                return;
            }

            options = options || {};

            // Make sure the collection is not reset and no entries are removed
            options.update = true;
            options.remove = false;

            options.data = options.data || {};

            // Apply bounds for next page based on current _meta_ data
            _.extend(options.data, {
                limit: this.meta.limit,
                offset: Math.min(this.meta.offset + this.meta.limit, this.meta.total_count)
            });

            return this.fetch(options);
        },
        /*
            Fetch previous page and add it to the collection
        */
        fetchPrevious: function(options) {
            if (!this.meta) {
                console.error("Got no meta data. Can't load previous page!");
                return;
            }

            options = options || {};

            // Make sure the collection is not reset and no entries are removed
            options.update = true;
            options.remove = false;

            options.data = options.data || {};

            // Apply bounds for previous page based on current _meta_ data
            _.extend(options.data, {
                limit: this.meta.limit,
                offset: Math.max(this.meta.offset - this.meta.limit, 0)
            });

            return this.fetch(options);
        }
    });
})(window.$, window._, window.Backbone);