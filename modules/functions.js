exports.btoa = (str) => {
    str = new Buffer.from(str).toString('base64');
    return str;
}

exports.atob = (str) => {
    str = new Buffer.from(str, 'base64').toString('utf-8');
    return str;
}

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

exports.log = (module, task, e) => {
    let current_datetime = new Date()
    let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds();
    let error = `[${formatted_date}] [${module}] ${task}: ${e.toString()} on line ${e.lineNumber}`;

    fs.appendFile('message.txt', 'data to append', function (err) {
        if (err) {
            console.log("[LOGGER] Failed to log error :hmm: " + err.toString());
        }
    });
}
