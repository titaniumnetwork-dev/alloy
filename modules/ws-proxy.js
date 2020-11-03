// Include external code
const WebSocket = require('ws');
const fs = require('fs');

// Include alloy modules
const $ = require('./functions.js');

// Read config
const config = JSON.parse(fs.readFileSync('config/config.json', {encoding:'utf8'}));
// Ensure prefix is defined properly
config.prefix = "/" + config.prefix.replace(/^\/+|\/+$/g, '') + "/";

module.exports = (server) => {
    // Start ws server
    const wss = new WebSocket.Server({server: server});

    wss.on('connection', (cli, req) => {
        try {
            // Start a ws client
            const svr = new WebSocket($.atob(req.url.toString().replace(config.prefix + 'ws/', '')));

            svr.on('message', (data) => {
                try {
                    cli.send(data)
                } catch(err){
                    $.log("WS", "Error Sending Data", err);
                }
            });

            svr.on('open', () => {
                cli.on('message', (data) => {
                  svr.send(data)
                });
            });

            cli.on('close', (code) => {
                try {
                    svr.close(code);
                } catch(err) {
                    $.log("WS", "Error Closing Server Socket", err);
                    svr.close(1006);
                };
            });
            svr.on('close', (code) => {
                try {
                    cli.close(code);
                } catch(err) {
                    $.log("WS", "Error Closing Client Socket", err);
                    cli.close(1006)
                };
            });
            cli.on('error', (err) => {
                try {
                    svr.close(1001);
                } catch(err) {
                    $.log("WS", "Error Closing Server Socket", err);
                    svr.close(1006);
                };
            });
            svr.on('error', (err) => {
                try {
                    cli.close(1001);
                } catch(err) {
                    $.log("WS", "Error Closing Client Socket", err);
                    cli.close(1006)
                };
            });
        } catch(err) {
            $.log("WS", "Unknown Error", err);
            cli.close(1001);
        }
    });
}
