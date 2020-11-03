const fs = require('fs');

// Easy encoding of b64
exports.btoa = (str) => {
    str = new Buffer.from(str).toString('base64');
    return str;
}

// Easy decoding of b64
exports.atob = (str) => {
    str = new Buffer.from(str, 'base64').toString('utf-8');
    return str;
}

// method to rewrite url
exports.rewrite_url = (dataURL, option) => {
    var websiteURL;
    var websitePath;
    if (option == 'decode') {
        websiteURL = exports.atob(dataURL.split('/').splice(0, 1).join('/'));
        websitePath = '/' + dataURL.split('/').splice(1).join('/');
    } else {
        websiteURL = exports.btoa(dataURL.split('/').splice(0, 3).join('/'));
        websitePath = '/' + dataURL.split('/').splice(3).join('/');
    }
    if (websitePath == '/') {
        return websiteURL;
    } else {
        return websiteURL + websitePath;
    }
}

// Logs errors and notices, with time stamp.
exports.log = (module, task, e = false) => {
    let current_datetime = new Date();
    let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds();
    let msg;

    if (e === false) {
        msg = `[${formatted_date}] [${module}] ${task}`;
    }
    else {
        msg = `[${formatted_date}] [${module}] ${task}: ${e.toString()} on line ${e.lineNumber}`;
    }

    fs.appendFile('alloy.log', msg + "\n", function (err) {
        if (err) {
            console.log("[LOGGER] Failed to log error :hmm: " + err.toString());
        }
    });
}
