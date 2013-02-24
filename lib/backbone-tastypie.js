/*
    Compability layer around Backbone.Model and Backbone.Collection for use with django-tastypie apis
*/

(function($, _, Backbone) {
    Backbone.Tastypie = {
        authCredentials: null
    };

    Backbone.Tastypie.getAuthUrlParams = function() {
        return "?username=" + Backbone.Tastypie.authCredentials.username + "&api_key=" + Backbone.Tastypie.authCredentials.apiKey;
    };

    Backbone.Tastypie.addAuthentication = function(method, model, options) {
        // Set authorization headers to authenticate the request
        options.headers = options.headers || {};
        _.extend(options.headers, {
            'Authorization': 'ApiKey ' + Backbone.Tastypie.authCredentials.username + ':' + Backbone.Tastypie.authCredentials.apiKey
        });

        // // Additionally add authentication credentials to get params for compability with tastypie < 0.9.12
        // if (method == "read") {
        //     options.data = options.data || {};
        //     // If we're doing a GET request, we can simply include the params in the options.data object
        //     _.extend(options.data, {
        //         username: Backbone.Tastypie.authCredentials.username,
        //         api_key: Backbone.Tastypie.authCredentials.apiKey
        //     });
        // } else {
        //     // Otherwise we have to directly add them to the url
        //     options.url = options.url || _.result(model, 'url');
        //     options.url += Backbone.Tastypie.getAuthUrlParams();
        // }

        return options;
    };

    Backbone.Tastypie.Model = Backbone.Model.extend({
        sync: function(method, model, options) {
            if (Backbone.Tastypie.authCredentials) {
                Backbone.Tastypie.addAuthentication(method, model, options);
            }
            return Backbone.Model.prototype.sync.call(this, method, model, options);
        },
        url: function() {
            var url = Backbone.Model.prototype.url.apply(this, arguments);
            if (_.last(url) != "/") {
                url += "/";
            }
            return url;
        }
    });

    Backbone.Tastypie.Collection = Backbone.Collection.extend({
        initialize: function(models, options) {
            Backbone.Collection.prototype.initialize.call(this, models, options);
            this.meta = {};
            this.url = options && options.url || this.url;

            // These filters will be inserted into each request, unless a _filters_ option explicitly provided
            // in _fetch()_, _fetchNext()_ or _fetchPrevious()_
            this.filters = options && options.filters || this.filters || {};
        },
        sync: function(method, collection, options) {
            if (Backbone.Tastypie.authCredentials) {
                Backbone.Tastypie.addAuthentication(method, collection, options);
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
                filters = filters.apply(this);
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
        },
        hasNextPage: function() {
            return this.meta.offset + this.meta.limit < this.meta.total_count;
        },
        fetchAll: function(options) {
            options = options || {};
            var success = options.success;
            options.success = _.bind(function(collection, response) {
                if (this.hasNextPage()) {
                    this.fetchNext(options);
                } else if (success) {
                    success(collection, response, options);
                }
            }, this);
            this.fetch(options);
        },
        startPolling: function(interval, options) {
            this.pollInterval = setInterval(_.bind(function() {
                this.fetch(options);
            }, this), interval || 60000);
        },
        stopPolling: function() {
            clearInterval(this.pollInterval);
        }
    });
})(window.$, window._, window.Backbone);