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
            return $L("{{ minutes }} minutes ago").replace("{{ minutes }}", f(minutes));
        } else if (days < 1) {
            return $L("{{ hours }} hours ago").replace("{{ hours }}", f(hours));
        } else if (days < 30) {
            return $L("{{ days }} days ago").replace("{{ days }}", f(days));
        } else {
            return $L("a while back...");
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
    }
};