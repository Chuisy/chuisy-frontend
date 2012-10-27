enyo.kind({
    name: "ComposeChuboxItem",
    kind: "FittableRows",
    published: {
        user: null
    },
    events: {
        onBack: ""
    },
    create: function() {
        chuisy.authCredentials = {
            username: "martin.kleinschrodt.5",
            api_key: "3f69fe1c06d967c43e28feb14102aee029fc3ae9"
        };
        this.inherited(arguments);
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
        this.imageTicket = new Date().getTime();
        try {
            this.upload(uri, this.ticket);
        } catch (e) {
            this.warn("No uploading service available!");
        }
        this.$.chuboxItemForm.clear();
        this.$.chuboxItemForm.setImage(uri);
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
            encodeURI("http://api.chuisy.com/v1/upload_product_image/?username=" + chuisy.authCredentials.username + "&api_key=" + chuisy.authCredentials.api_key),
            enyo.bind(this, function(r) {
                this.image = r.response;
                this.log("file uploaded! " + r.response);
                this.uploading = false;
            }), function(error) {
                console.log("fail!", error);
            }, options);
    },
    locationPicked: function (sender, event) {
        this.$.chuboxItemForm.setLocation(event.location);
        this.$.panels.setIndex(1);
    },
    submit: function() {
        var data = this.$.chuboxItemForm.getData();
        var userId = this.user ? this.user.id : "null";
        data.image = "http://api.chuisy.com/static/uploaded/" +  userId + "_" + this.imageTicket + ".jpg";
        data.user = this.user;
        this.log(data);
        // Have to create the place first as deeply nested resources are not created automatically
        chuisy.place.create(data.location.place, enyo.bind(this, function(sender, response) {
            data.location.place = response.resource_uri;
            chuisy.chuboxitem.create(data, enyo.bind(this, function(sender, response) {
                this.log(response);
            }));
        }));
    },
    back: function() {
        if (this.$.panels.getIndex() == 1) {
            this.$.panels.setIndex(0);
        } else {
            this.doBack();
        }
    },
    components: [
        {classes: "mainheader", content: "Chuisy", components: [
            {kind: "onyx.Button", ontap: "back", classes: "back-button", content: "back"},
            {classes: "mainheader-text", content: "Chuisy"}
        ]},
        {kind: "Panels", fit: true, arrangerKind: "CarouselArranger", classes: "enyo-fill", draggable: false, components: [
            {kind: "PickLocation", classes: "enyo-fill", onLocationPicked: "locationPicked"},
            {kind: "ChuboxItemForm", classes: "enyo-fill", onSubmit: "submit"}
        ]}
    ]
});