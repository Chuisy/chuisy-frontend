enyo.kind({
    name: "ComposeChu",
    kind: "FittableRows",
    events: {
        onBack: ""
    },
    userChanged: function(sender, event) {
        this.user = event.user;
    },
    initialize: function() {
        this.$.panels.setIndex(0);
        this.getImage();
    },
    getImage: function(callback) {
        try {
            navigator.camera.getPicture(enyo.bind(this, this.gotImage), enyo.bind(this, function() {
                this.warn("Getting image failed!");
                this.doBack();
            }), {allowEdit: true, targetWidth: 1024, targetHeight: 1024});
        } catch (e) {
            this.warn("No camera available!");
            this.gotImage("");
        }
    },
    gotImage: function(uri) {
        this.imageUri = uri;
        this.imageTicket = new Date().getTime();
        try {
            this.upload(uri, this.imageTicket);
        } catch (e) {
            this.warn("No uploading service available!");
        }
        this.$.chuForm.clear();
        this.$.chuForm.setImage(uri);
        this.$.pickLocation.getGeoLocation();
    },
    upload: function(uri, ticket) {
        var options = new FileUploadOptions();
        options.fileKey="image";
        options.fileName=uri.substr(uri.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";
                                
        options.params = {
            ticket: ticket
        };
                                
        var ft = new FileTransfer();

        this.uploading = true;
        ft.upload(uri,
            encodeURI("http://api.chuisy.com/v1/upload_chubox_image/?username=" + chuisy.authCredentials.username + "&api_key=" + chuisy.authCredentials.api_key),
            enyo.bind(this, function(r) {
                this.image = r.response;
                this.log("file uploaded! " + r.response);
                this.uploading = false;
            }), function(error) {
                console.log("fail!", error);
            }, options);
    },
    locationPicked: function (sender, event) {
        this.$.chuForm.setLocation(event.location);
        this.$.panels.setIndex(1);
    },
    submit: function() {
        var chu = this.$.chuForm.getData();
        // var userId = this.user ? this.user.id : "null";
        // data.image = "chubox/" + userId + "/" + this.imageTicket + ".jpg";
        // chu.image = this.imageUri;
        // Have to create the place first as deeply nested resources are not created automatically
        // chuisy.place.create(data.location.place, enyo.bind(this, function(sender, response) {
        //     data.location.place = response.resource_uri;
        //     chuisy.chu.create(data, enyo.bind(this, function(sender, response) {
        //         this.log(response);
        //     }));
        // }));
        chuisy.chubox.add(chu);
        this.doBack();
    },
    back: function() {
        if (this.$.panels.getIndex() == 1) {
            this.$.panels.setIndex(0);
        } else {
            this.doBack();
        }
    },
    components: [
        {classes: "mainheader", components: [
            {kind: "onyx.Button", ontap: "back", classes: "back-button", content: "back"},
            {classes: "mainheader-text", content: "chuisy"}
        ]},
        {kind: "Panels", fit: true, arrangerKind: "CarouselArranger", classes: "enyo-fill", draggable: false, components: [
            {kind: "PickLocation", classes: "enyo-fill", onLocationPicked: "locationPicked"},
            {kind: "ChuForm", classes: "enyo-fill", onSubmit: "submit"}
        ]},
        {kind: "Signals", onUserChanged: "userChanged"}
    ]
});