enyo.kind({
	name: "StoreView",
	classes: "storeview",
	published: {
		store: null
	},
	events: {
		onShowChu: "",
		onShowUser: "",
		onBack: ""
	},
	listenTo: Backbone.Events.listenTo,
    stopListening: Backbone.Events.stopListening,
	storeChanged: function() {
		this.$.chusMenuButton.setActive(true);
		this.$.panels.setIndex(0);

        var rand = Math.ceil(Math.random()*2);
        this.coverPlaceholder = "assets/images/store_cover_placeholder_" + rand + ".jpg";
        this.$.info.applyStyle("background-image", "url()");

        this.updateView();

        this.stopListening();
        this.listenTo(this.store, "change", this.updateView);

        this.$.followersList.setUsers(this.store.followers);
        this.refreshFollowers();
        this.listenTo(this.store.followers, "sync", this.refreshFollowers);

        this.$.chuList.setChus(this.store.chus);
	},
	updateView: function() {
        this.$.name.setContent(this.store.get("name"));
        this.$.chusCount.setContent(this.store.get("chu_count"));
        this.$.followButton.setContent(this.store.get("following") ? "unfollow" : "follow");
        this.$.followersCount.setContent(this.store.get("follower_count"));

        var coverImage = this.store.get("cover_image") || this.coverPlaceholder;
        this.$.info.applyStyle("background-image", "url(" + coverImage + ")");

        this.updateInfoText();
    },
    refreshFollowers: function() {
        this.$.followersSpinner.hide();
        var coll = this.store && this.store.followers;
        var count = coll && (coll.meta && coll.meta.total_count || coll.length) || 0;
        this.$.followersCount.setContent(count);
        this.$.followersPlaceholder.setShowing(!count);
    },
	showChu: function(sender, event) {
		if (App.checkConnection()) {
            this.doShowChu(event);
        }
        return true;
    },
	menuItemSelected: function(sender, event) {
        if (event.originator.getActive()) {
            this.$.panels.setIndex(event.originator.value);
        }
    },
    activate: function(obj) {
		if (obj) {
			this.setStore(obj);
		}

		if(this.store) {
            this.$.followersSpinner.setShowing(!this.store.followers.length);
            this.store.followers.fetch();

			this.$.chusSpinner.setShowing(!this.store.chus.length);
			this.$.chusPlaceholder.setShowing(!this.store || !this.store.chus.length);
			// this.$.followersSpinner.setShowing(!) <-- Spinner
			this.store.chus.fetch({data: {limit: this.$.chuList.getChusPerPage(), thumbnails: ["100x100"]}, success: enyo.bind(this, function() {
				this.$.chusSpinner.hide();
				this.$.chuList.setChus(this.store.chus);
				this.$.chusPlaceholder.setShowing(!this.store || !this.store.chus.length);
			})});
		}
    },
    deactivate: function() {},
    back: function() {
		if (this.$.map.hasClass("showing")) {
			this.$.map.removeClass("showing");
		} else {
			this.doBack();
		}
    },
    showMap: function() {
		if (this.store && this.store.get("latitude")) {
			this.$.map.addClass("showing");
			this.$.map.initialize();
			this.setLocationMarker();
		}
    },
    setLocationMarker: function() {
        //add marker
        var lat = this.store.get("latitude");
        var lng = this.store.get("longitude");
        var coords = {
            latitude: lat,
            longitude: lng
        };

        //add popup to marker
        var name = this.store.get("name");
        var address = this.store.get("address");
        var zipcode = this.store.get("zip_code");
        var city = this.store.get("city");
        if (address) {
            address = "<br>" + address;
        } if (zipcode) {
            zipcode = "<br>" + zipcode + ", ";
        } else if (city) {
            city = "<br>" + city;
        }
        var popup = "<strong>" + name + "</strong>" + "<span style='font-size: 14px'>" + (address || "") + (zipcode || "") + (city || "") + "</span>";

        this.$.map.clearMarkers();
        this.$.map.addMarker(coords, null, popup, null, true);

        this.$.map.setCenter(coords);
    },
    updateInfoText: function() {
		this.$.address.setContent(this.store.get("address") || "");

		var zipCode = this.store.get("zip_code");
		var city = zipCode ? zipCode + " " : "";
		city += this.store.get("city") || "";
		this.$.city.setContent(city);

		// this.$.phone.setContent(this.store.get("phone") ?
		// 	"<strong>" + $L("Phone: ") + "</strong><a href='tel:'" + this.store.get("phone") + "'>" + this.store.get("phone") + "</a>"
		// 	: "");
		this.$.phone.setContent(this.store.get("phone") ? "<strong>" + $L("Phone: ") + "</strong>" + this.store.get("phone") : "");
		this.$.website.setContent(this.store.get("website") ? "<strong>" + $L("Web: ") + "</strong>" + this.store.get("website") : "");
		this.$.email.setContent(this.store.get("email") ? "<strong>" + $L("Email: ") + "</strong>" + this.store.get("email") : "");

		this.$.openingHours.setContent(this.store.get("opening_hours") && this.store.get("opening_hours").replace(/\n/g, "<br>"));
		this.$.openingHoursContainer.setShowing(this.store.get("opening_hours"));

		this.$.moreInfo.setContent(this.store.get("info") && this.store.get("info").replace(/\n/g, "<br>"));
		this.$.moreInfoContainer.setShowing(this.store.get("info"));

		var lat = this.store.get("latitude");
		var lng = this.store.get("longitude");

		if (lat && lng) {
			var url = "http://maps.googleapis.com/maps/api/staticmap?markers=" + this.store.get("latitude") + "," + this.store.get("longitude") + "&zoom=17&size=75x75&scale=1.5&sensor=false";
			this.$.locationButton.applyStyle("background-image", "url(" + url + ")");
			this.$.locationButton.show();
		} else {
			this.$.locationButton.hide();
		}
	},
    followButtonTapped: function() {
        if (App.checkConnection()) {
            App.requireSignIn(enyo.bind(this, this.toggleFollow), "follow_store");
        }
    },
    toggleFollow: function(sender, event) {
        this.store.toggleFollow();
        return true;
    },
	components: [
        {kind: "FittableRows", classes: "enyo-fill", components: [
			{classes: "header", components: [
				{kind: "onyx.Button", ontap: "back", classes: "back-button", content: $L("back")}
			]},
			{kind: "FittableRows", fit: true, components: [
				{kind: "Map", name: "map", classes: "storeview-map", zoom: 17},
				{classes: "storeview-window", name: "window", components: [
					{classes: "storeview-info storeview-cover-placeholder", components: [
                        {kind: "CssSpinner", classes: "absolute-center"}
                    ]},
					{classes: "storeview-info", name: "info", components: [
						{classes: "storeview-fullname", name: "name"},
						{classes: "storeview-settings-button", ontap: "doShowSettings"},
						{kind: "onyx.Button", name: "followButton", content: "follow", ontap: "followButtonTapped", classes: "storeview-follow-button follow-button"}
					]}
				]},
				{kind: "onyx.RadioGroup", onActivate: "menuItemSelected", classes: "storeview-menu", components: [
					{classes: "storeview-menu-button", value: 0, name: "chusMenuButton", components: [
						{classes: "storeview-menu-button-caption", content: $L("Chus")},
						{classes: "storeview-menu-button-count", name: "chusCount"}
					]},
					{classes: "storeview-menu-button", value: 1, name: "followersMenuButton", components: [
						{classes: "storeview-menu-button-caption", content: $L("Follower")},
						{classes: "storeview-menu-button-count", name: "followersCount"}
					]},
					{classes: "storeview-menu-button", value: 2, name: "infoMenuButton", components: [
						{classes: "storeview-menu-button-caption", content: $L("Info")},
						{kind: "Image", src: "assets/images/info.png", style: "width: 13px; height: 13px; margin-top: -5px;"}
					]}
				]},
				{kind: "Panels", name: "panels", fit: true, draggable: false, components: [
					{classes: "enyo-fill", components: [
						{kind: "CssSpinner", classes: "storeview-tab-spinner", name: "chusSpinner", showing: false},
						{name: "chusPlaceholder", classes: "storeview-list-placeholder chus"},
						{kind: "ChuList", name: "chuList", classes: "enyo-fill", onShowChu: "showChu", onRefresh: "chuListRefresh"}
					]},
					{classes: "enyo-fill", components: [
						{kind: "CssSpinner", classes: "storeview-tab-spinner", name: "followersSpinner", showing: false},
						{name: "followersPlaceholder", classes: "storeview-list-placeholder followers"},
						{kind: "UserList", name: "followersList", classes: "enyo-fill", rowsPerPage: 20}
					]},
					{kind: "Scroller", strategyKind: "TransitionScrollStrategy", classes: "enyo-fill", components: [
						{kind: "onyx.Button", name: "locationButton", ontap: "showMap", classes: "storeview-location-button"},
						{classes: "storeview-info-block", components: [
							{classes: "storeview-info-text", components: [
								{name: "address"},
								{name: "city"},
								{name: "phone", allowHtml: true},
								{name: "website", allowHtml: true},
								{name: "email", allowHtml: true}
							]}
						]},
						{classes: "storeview-info-block", name: "openingHoursContainer", components: [
							{classes: "storeview-info-header", content: $L("Opening hours:")},
							{classes: "storeview-info-text", allowHtml: true, name: "openingHours"}
						]},
						{classes: "storeview-info-block", name: "moreInfoContainer", components: [
							{classes: "storeview-info-header", content: $L("Additional Info:")},
							{classes: "storeview-info-text", allowHtml: true, name: "moreInfo"}
						]}
					]}
				]}
			]}
        ]}
    ]
});