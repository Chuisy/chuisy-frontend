enyo.kind({
	name: "SignUpForm",
	classes: "signupform",
	events: {
		onSubmit: ""
	},
	create: function() {
		this.inherited(arguments);
		this.usernameValid = false;
		this.emailValid = false;
	},
	clear: function() {
		this.$.username.setValue("");
		this.$.username.setValid(null);
		this.$.firstName.setValue("");
		this.$.firstName.setValid(null);
		this.$.lastName.setValue("");
		this.$.lastName.setValid(null);
		this.$.email.setValue("");
		this.$.email.setValid(null);
		this.$.password.setValue("");
		this.$.password.setValid(null);
	},
	checkFirstName: function() {
		this.$.firstName.setValid(this.$.firstName.getValue() !== "");
	},
	checkLastName: function() {
		this.$.lastName.setValid(this.$.lastName.getValue() !== "");
	},
	checkUsername: function() {
		if (!this.$.username.getValue()) {
			this.$.username.setValid(false);
			this.$.username.setErrorMessage("Please enter a username!");
		} else {
			this.$.username.setValid(true);
			chuisy.isUnique({user_name: this.$.username.getValue()}, enyo.bind(this, function(sender, response){
				if (response.user_name) {
					this.$.username.setValid(true);
				} else {
					this.$.username.setValid(false);
					this.$.username.setErrorMessage("Sorry, this username is already taken.");
				}
			}));
		}
	},
	checkEmail: function() {
		var pattern = /^([\w\d\-\.]+)@{1}(([\w\d\-]{1,67})|([\w\d\-]+\.[\w\d\-]{1,67}))\.(([a-zA-Z\d]{2,4})(\.[a-zA-Z\d]{2})?)$/;
		var email = this.$.email.getValue();

		if (!email) {
			this.$.email.setValid(false);
			this.$.email.setErrorMessage("Please enter an email address!");
		} else if (!email.match(pattern)) {
			this.$.email.setValid(false);
			this.$.email.setErrorMessage("Please enter a valid email address!");
		} else {
			this.$.email.setValid(true);
			chuisy.isUnique({email: this.$.email.getValue()}, enyo.bind(this, function(sender, response) {
				if (response.email) {
					this.$.email.setValid(true);
				} else {
					this.$.email.setValid(false);
					this.$.email.setErrorMessage("There already exists an account with this email address.");
				}
			}));
		}
	},
	checkPassword: function() {
		if (!this.$.password.getValue()) {
			this.$.password.setValid(false);
			this.$.password.setErrorMessage("Please enter a password!");
		} else if (this.$.password.getValue().length < 6) {
			this.$.password.setValid(false);
			this.$.password.setErrorMessage("The password has to be at leat 6 characters long.");
		} else {
			this.$.password.setValid(true);
		}
		// var same = this.$.password1.getValue() == this.$.password2.getValue();

		// if (!this.$.password1.getValue()) {
		// 	this.$.password1.setValid(false);
		// 	this.$.password2.setValid(false);
		// 	this.$.password1.setErrorMessage("Bitte ein Passwort eingeben!");
		// } else if (this.$.password1.getValue() && this.$.password2.getValue() && !same) {
		// 	this.$.password1.setValid(false);
		// 	this.$.password2.setValid(false);
		// 	this.$.password1.setErrorMessage("Passwörter stimmen nicht überein!");
		// } else {
		// 	this.$.password1.setValid(true);
		// 	this.$.password2.setValid(true);
		// }
	},
	allValid: function() {
		this.checkFirstName();
		this.checkLastName();
		this.checkUsername();
		this.checkEmail();
		this.checkPassword();
		this.log(this.$.firstName.getValid(), this.$.lastName.getValid(), this.$.email.getValid(), this.$.username.getValid(), this.$.password.getValid());
		return this.$.firstName.getValid() && this.$.lastName.getValid() && this.$.email.getValid() && this.$.username.getValid() && this.$.password.getValid();
	},
	submit: function() {
		if (this.allValid()) {
			var data = {
				username: this.$.username.getValue(),
				password: this.$.password.getValue(),
				email: this.$.email.getValue(),
				first_name: this.$.firstName.getValue(),
				last_name: this.$.lastName.getValue()
			};
			this.doSubmit({data: data});
			this.clear();
		}
	},
	components: [
		{kind: "FormField", name: "firstName", placeholder: "Vorname", required: true, onchange: "checkFirstName", errorMessage: "Please enter your first name!"},
		{kind: "FormField", name: "lastName", placeholder: "Nachname", required: true, onchange: "checkLastName", errorMessage: "Please enter your last name!"},
		{kind: "FormField", name: "email", placeholder: "Email", required: true, onchange: "checkEmail"},
		{kind: "FormField", name: "username", placeholder: "Benutzername", required: true, onchange: "checkUsername"},
		{kind: "FormField", name: "password", type: "password", placeholder: "Passwort", required: true, onchange: "checkPassword"},
		// {kind: "FormField", name: "password2", type: "password", placeholder: "Passwort wiederholen", required: true, onchange: "checkPassword"},
		{kind: "onyx.Button", content: "Submit", ontap: "submit", classes: "onyx-affirmative", style: "width: 100%;"}
	]
});