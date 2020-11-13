const Alloy = require('alloyproxy'),
    rewrite = require('alloyproxy/libs/rewriting.js'),
    config = require('./config.json'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    querystring = require('querystring'),
    express = require('express'),
    app = express();
    
if (!config.prefix.startsWith('/')) config.prefix = '/' + config.prefix;

if (!config.prefix.endsWith('/')) config.prefix = config.prefix + '/';

var server, protocol = 'http://';

const ssl_options = {
    key: fs.readFileSync('./ssl/default.key'),
    cert: fs.readFileSync('./ssl/default.crt')
};

if (config.ssl == true) { server = https.createServer(ssl_options, app); protocol = 'https://' } else server = http.createServer(app);


btoa = (str) => {

	str = new Buffer.from(str).toString('base64');
	return str;

};


atob = (str) => {

    str = new Buffer.from(str, 'base64').toString('utf-8');
	return str;

};

const Unblocker = new Alloy({
    prefix: config.prefix,
    error: (proxy) => { proxy.res.send(fs.readFileSync('./error.html', { encoding: 'utf8' }).replace('%ERR%', proxy.error.info.message.replace(/</gi, '<&zwnj;').replace(/>/gi, '>&zwnj;'))); }, // Doing replace functions on "<" and ">" to prevent XSS.
    request: [],
    response: [],
    injection: true,
});    
 
// The main part of the proxy. 

app.use(config.prefix, (req, res, next) => {

    req.url = config.prefix + req.url.slice(1);

    if (config.cookie_auth) {

        if (req.headers['cookie'] && req.headers['cookie'].match(config.cookie_auth)) return Unblocker.app(req, res, next);
    
        res.send(fs.readFileSync('./error.html', { encoding: 'utf8' }).replace('%ERR%', 'Authorization required'));

        res.statusCode = 400;

    } else Unblocker.app(req, res, next);
    
});

app.get(config.prefix, (req, res, next) => {

    if (req.query.url) {

        var url = atob(req.query.url);

        if (url.startsWith('//')) url = 'http:' + url;

        if (url.startsWith('https://') || url.startsWith('http://')) { return res.redirect(config.prefix + rewrite.url(url)) }

        else return res.redirect(config.prefix + rewrite.url('http://' + url))

    } else return next();

});

app.post(`/session/`, async(req, res, next) => {

    req.body = await new Promise(resolve => {
 
        var body = '';

        req.on('data', chunk => body += chunk).on('end', () => {

            try {

                if (body.startsWith('{') && body.endsWith('}')) { resolve(JSON.parse(body)) }

                else {

            resolve(querystring.parse(body));

          };

        } catch(err) { resolve({}) }  


        });

      });

    if (req.body.url) {

        if (req.body.url.startsWith('//')) { req.body.url = 'http:' + req.body.url; } else if (req.body.url.startsWith('https://') || req.body.url.startsWith('http://')) { req.body.url = req.body.url } else { req.body.url = 'http://' + req.body.url};

        if (config.cookie_auth) {

            res.set('Set-Cookie', config.cookie_auth + `; path=${config.prefix};`);

        };

        return res.redirect(config.prefix + rewrite.url(req.body.url));

    } else next();


});

// Frontend.

app.use('/', express.static('public'));

// WebSocket handler.

Unblocker.ws(server);    

server.listen(config.port, () => console.log(`Running on ${protocol}0.0.0.0:${config.port}`));
