enyo.kind({
	name: "Settings",
	kind: "FittableRows",
	classes: "Settings",
	published: {
		user: null
	},
	events: {
		onLogout: "",
		onToggleMenu: ""
	},
	userChanged: function() {
		if (this.user) {
			this.$.firstName.setValue(this.user.first_name);
			this.$.lastName.setValue(this.user.last_name);
			this.$.website.setValue(this.user.profile.website);
			this.$.bio.setValue(this.user.profile.bio);
		}
	},
	firstNameChanged: function() {
		this.user.first_name = this.$.firstName.getValue();
		this.updateUser();
	},
	lastNameChanged: function() {
		this.user.last_name = this.$.lastName.getValue();
		this.updateUser();
	},
	websiteChanged: function() {
		this.user.profile.website = this.$.website.getValue();
		this.updateUser();
	},
	bioChanged: function() {
		this.user.profile.bio = this.$.bio.getValue();
		this.updateUser();
	},
	updateUser: function() {
		chuisy.user.put(this.user.id, this.user, enyo.bind(this, function(sender, response) {
			this.log(response);
		}));
	},
	changePassword: function() {
		chuisy.changePassword(this.user.username, this.$.oldPassword.getValue(), this.$.newPassword.getValue(), enyo.bind(this, function(sender, response) {
			this.log(response);
			alert("Password changed successfully!");
			this.$.oldPassword.setValue("");
			this.$.newPassword.setValue("");
		}));
	},
    // facebookSignIn: function() {
    //     window.location = "https://www.facebook.com/dialog/oauth?client_id=180626725291316&redirect_uri=http://api.chuisy.com/v1/fb_auth/&scope=user_birthday,user_location,user_about_me,user_website,email";
    // },
	components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "doToggleMenu", classes: "menu-button", components: [
                {kind: "Image", src: "assets/images/menu-icon.png"}
            ]},
            {classes: "mainheader-text", content: "Settings"}
        ]},
		{classes: "main-content", fit: true, components: [
			{kind: "onyx.Groupbox", components: [
				{kind: "onyx.GroupboxHeader", content: "Account Settings"},
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.Input", name: "firstName", placeholder: "First Name", onchange: "firstNameChanged"}
				]},
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.Input", name: "lastName", placeholder: "Last Name", onchange: "lastNameChanged"}
				]},
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.Input", name: "website", placeholder: "Website", onchange: "websiteChanged"}
				]},
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.TextArea", name: "bio", placeholder: "Bio", onchange: "bioChanged"}
				]}
			]},
			{kind: "onyx.Groupbox", components: [
				{kind: "onyx.GroupboxHeader", content: "Change Password"},
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.Input", name: "oldPassword", type: "password", placeholder: "Old Password"}
				]},
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.Input", name: "newPassword", type: "password", placeholder: "New Password"}
				]},
				{kind: "onyx.Button", content: "Change Password", ontap: "changePassword", style: "width: 100%;"}
			]},
			{kind: "onyx.Button", content: "Logout", ontap: "doLogout"}
		]}
	]
});