window.onerror = function(message, file, line) {
    var data = {
        message: message,
        file: file,
        line: line
    };

    try {
        App.sendCubeEvent("error", data);
    } catch(e) {
        cube.send("error", data);
    }
};