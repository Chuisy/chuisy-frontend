window.util = {
    timeToText: function(time) {
        if (!time) {
            return $L("just now");
        }

        var now = new Date();
        var posted = new Date(time);
        var seconds = (now.getTime() - posted.getTime()) / 1000;
        var minutes = seconds / 60;
        var hours = minutes / 60;
        var days = hours / 24;
        var f = Math.floor;

        if (minutes < 1) {
            return $L("just now");
        } else if (hours < 1) {
            return $L("{{ minutes }} min").replace("{{ minutes }}", f(minutes));
        } else if (days < 1) {
            return $L("{{ hours }} h").replace("{{ hours }}", f(hours));
        } else if (days < 30) {
            return $L("{{ days }} d").replace("{{ days }}", f(days));
        } else {
            return $L("a while back");
        }
    },
    createThumbnail: function(imgSrc, width, height, callback) {
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext("2d");
        var img = new Image();
        img.onload = function() {
            var targetWidth, targetHeight, targetX, targetY;
            if (img.width < img.height) {
                targetWidth = width;
                targetHeight = width/img.width*img.height;
                targetX = 0;
                targetY = (height-targetHeight)/2;
            } else {
                targetWidth = height/img.height*img.width;
                targetHeight = height;
                targetX = (width-targetWidth)/2;
                targetY = 0;
            }

            context.drawImage(img, targetX, targetY, targetWidth, targetHeight);
            callback(canvas.toDataURL());
        };
        img.src = imgSrc;
    },
    watermark: function(imgSrc, callback) {
        var canvas = document.createElement("canvas");
        canvas.width = 612;
        canvas.height = 612;
        var context = canvas.getContext("2d");
        var img = new Image();
        var watermark = new Image();

        img.onload = function() {
            watermark.src = "assets/images/watermark.png";
        };
        watermark.onload = function() {
            context.drawImage(img, 0, 0, 612, 612);
            context.drawImage(watermark, 0, 0, 612, 612);
            callback(canvas.toDataURL());
        };
        img.src = imgSrc;
    },
    generateUuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
};