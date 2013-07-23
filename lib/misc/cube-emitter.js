(function() {
    var socket, cue = [];

    function openSocket() {     
        socket = new WebSocket("ws://analytics.chuisy.com:1080/1.0/event/put");

        socket.onopen = function() {
            console.log("cube: socket opened");
            emptyCue();
        };

        socket.onmessage = function(message) {
            var event = JSON.parse(message.data);
            console.log("cube: received", event);
        };

        socket.onclose = function() {
            console.log("cube: socket closed");
        };

        socket.onerror = function(error) {
            console.log("cube: error", error);
        };
    }

    function emptyCue() {
        var cueBuffer = cue.concat([]);
        cue = [];

        if (socket.readyState != 1) {
            console.warn("Can't empty cue: Socket is not ready.");
            return;
        }

        for (var i = 0; i < cueBuffer.length; i++) {
            try {
                socket.send(JSON.stringify(cueBuffer[i]));
            } catch (e) {}
        }
    }

    window.cube = {
        send: function(type, data) {
            cue.push({
                type: type,
                time: new Date(),
                data: data
            });

            if (socket && socket.readyState == 1) {
                emptyCue();
            } else if (!socket || socket.readyState !== 0) {
                openSocket();
            }
        }
    };

    openSocket();
})();