var fs = require("fs");
var pattern = /\$L\("(.+?)"\)/g;

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

var sourceDir = process.argv[2];
var stringsFile = process.argv[3];
var strings = {};
var stringsOld = {};

try {
    stringsOld = JSON.parse(fs.readFileSync(stringsFile));
    extend(stringsOld, stringsOld._deprecated);
    delete stringsOld._deprecated;
} catch(e) {}

var dirContents = fs.readdirSync(sourceDir);

var jsFiles = dirContents.filter(function(file) {
    return file.substr(-3) == '.js';
});

jsFiles.forEach(function(file) {
    var content = fs.readFileSync(sourceDir + file, {encoding: "utf-8"});
    while (match = pattern.exec(content)) {
        var s = match[1];
        strings[s] = strings[s] || stringsOld[s] || "";
        delete stringsOld[s];
    }
});

strings._deprecated = stringsOld;

fs.writeFileSync(stringsFile, JSON.stringify(strings, undefined, 4));