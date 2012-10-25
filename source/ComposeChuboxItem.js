enyo.kind({
    name: "ComposeChuboxItem",
    published: {
        user: null
    },
    create: function() {
        this.inherited(arguments);
        chuisy.authCredentials = {
            username: "martin.kleinschrodt.5",
            api_key: "3f69fe1c06d967c43e28feb14102aee029fc3ae9"
        };
    },
    clear: function() {
    },
    getImage: function(callback) {
        navigator.camera.getPicture(enyo.bind(this, this.gotImage), function() {}, {allowEdit: true, targetWidth: 1024, targetHeight: 1024});
    },
    gotImage: function(uri) {
        // this.upload(uri);
        this.$.chuboxItemForm.setImage(uri);
    },
    upload: function(uri) {
        var options = new FileUploadOptions();
        options.fileKey="image";
        options.fileName=uri.substr(uri.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";
                                
        options.params = {
            ticket: new Date().getTime()
        };
                                
        var ft = new FileTransfer();

        this.uploading = true;
        ft.upload(uri,
            encodeURI("http://api.chuisy.com/v1/upload_product_image/?username=" + chuisy.authCredentials.username + "&api_key=" + chuisy.authCredentials.api_key),
            enyo.bind(this, function(r) {
                this.image = r.response;
                alert("file uploaded! " + r.response);
                this.uploading = false;
            }), function(error) {
                console.log("fail!", error);
            }, options);
    },
    locationPicked: function (sender, event) {
        this.$.chuboxItemForm.setLocation(event.location);
        this.$.panels.setIndex(1);
        this.getImage();
    },
    components: [
        {kind: "Panels", arrangerKind: "CarouselArranger", classes: "enyo-fill", draggable: false, components: [
            {kind: "PickLocation", classes: "enyo-fill", onLocationPicked: "locationPicked"},
            {kind: "ChuboxItemForm", classes: "enyo-fill"}
        ]}
    ]
});