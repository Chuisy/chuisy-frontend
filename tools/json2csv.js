var fs = require('fs');
var inFile = process.argv[2];
var delimiter = process.argv[3] || "\x09";


try {
    json = JSON.parse(fs.readFileSync(inFile));
} catch(e) {
    json = {};
}

var csv = "";
for (var each in json) {
    if (json.hasOwnProperty(each)) {
        csv += each + delimiter + json[each] + "\n";
    }
}

fs.writeFile(inFile.replace(/.json$/, ".csv"), csv);