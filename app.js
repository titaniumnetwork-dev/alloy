const fetch = require('node-fetch');
const express = require("express");
const url = require('url');
const fs = require('fs')
const cookieParser = require('cookie-parser');
const http = require('http');
const https = require('https');
const session = require('express-session');
const bodyParser = require('body-parser');
const { response } = require('express');
const { gzip } = require('zlib');

const app = express();


app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
   extended: true
}));


 // How to use: base64Encode('string') will return any input base64 encoded
function base64Encode(data) {
    return new Buffer.from(data).toString('base64')
 }

 // How to use: base64Decode('string') will return any input base64 decoded
function base64Decode(data) {
    return new Buffer.from(data, 'base64').toString('ascii')
}

 // How to use: urlHostname('https://example.org/assets/main.js') will return any URL's hostname. Output: example.org
function urlHostname(dataURL) {
        const gettingLocationHostname = dataURL.split('/')
        gettingLocationHostname.shift()
        gettingLocationHostname.shift()
        return gettingLocationHostname.slice(0, 1).join('/')
}

 // How to use: rewritingURL('https://example.org/assets/main.js') will rewrite any external URL. Output: aHR0cHM6Ly9leGFtcGxlLm9yZw==/assets/main.js
function rewritingURL(dataURL) {
    const websiteURL = base64Encode(dataURL.split('/').splice(0, 3).join('/'))
    const websitePath = '/' + dataURL.split('/').splice(3).join('/')
    if (websitePath == '/') {
        return `${websiteURL}`
    } else return `${websiteURL}${websitePath}`
}

var config = JSON.parse(fs.readFileSync('config.json', 'utf-8')),
  httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
  }),
  httpAgent = new http.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
  }),
  ssl = { key: fs.readFileSync('ssl/default.key', 'utf8'), cert: fs.readFileSync('ssl/default.crt', 'utf8') },
  server,
  port = process.env.PORT || config.port,
  ready = (() => {
    var a = 'http://', b = config.listenip;
    if (config.ssl) a = 'https://';
    if (b == '0.0.0.0' || b == '127.0.0.1') b = 'localhost';
    console.log('Listening at', a + b + ':' + port);
  });

http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

if (config.ssl) server = https.createServer(ssl, app).listen(port, config.listenip, ready);
else server = http.createServer(app).listen(port, config.listenip, ready);




app.use(cookieParser());
app.use(session({
secret: 'titanium',
saveUninitialized: true,
resave: true
}));

app.use('/fetch/', function (req, res, next) {
    (async () => {        
        
        const httpAgent = new http.Agent({
            keepAlive: true
          });
          const httpsAgent = new https.Agent({
            keepAlive: true
          });
          const options = {
            method: req.method,
            headers: {
              'User-Agent': req.headers['user-agent'],
              'X-Frame-Options': '',
              'Content-Security-Policy': '',
               cookie: req.headers.cookie,
            },
            redirect: 'manual',
            agent: function(_parsedURL) {
              if (_parsedURL.protocol == 'http:') {
                return httpAgent;
              } else {
                return httpsAgent;
              }
            }
          };
        
        const urlHost = req.url.split('/').slice(1).slice(0, 1).join('/')
        const pathURL = req.url.split('/').slice(2).join('/')

        const fullURL = `${base64Decode(urlHost)}/${pathURL}`
        res.cookie('option', 'normal', { maxAge: 256000 });
        const locationHostname = urlHostname(fullURL)
        const response = await fetch(fullURL.replace(/(^:)\/\//, '/'), options).catch(err => fs.createReadStream('public/404.html').pipe(res));
        const body = await response.buffer().catch(console.log('Promise rejection catched!'))
        var ct = 'notset'
        const location = response.headers.get("Location");
        // Ensures that theres a / after the websites hostname for proper fetching
        if (!req.url.startsWith(`/${urlHost}/`)) {
          res.redirect('/fetch' + req.url + '/')
        }
        // For those URLs such as https://google.com redirecting to https://www.google.com
        if (location) {
          const host = location.split('/').slice(0, 3).join('/')
          const buff = new Buffer(host);
          const host64 = buff.toString('base64');
          const path = location.split('/').slice(3).join('/')
          res.redirect('/fetch/' + host64 + '/' + path)
        } 
        response.headers.forEach((e, i, a) => {
          if (i == 'content-type') ct = e;
        });
        var skip_headers = [
            /content-encoding/gi,
            /content-security-policy/gi,
            /x-frame-options/gi,
            /x-cache/gi,
            /^cf-/gi,
            /strict-transport-security/gi,
    ]
        var siteHeaders = new Object();
        response.headers.forEach((header_value, header_name)=>{
          if(skip_headers.some(s_name => header_name.toLowerCase().trim().match(s_name) ))return; // skip header if on list
          siteHeaders[header_name] = header_value
          if (header_name.match(/set-cookie/i)) {
            header_value = header_value.replace(/domain=(.*?)\,/, `domain=${req.hostname},`)
            
          }
          res.set(header_name, header_value)
      });
        
        if (ct == null || typeof ct == 'undefined') ct = 'text/html';
        res.contentType(ct)
        var serverResponse = body
        if (ct.startsWith('text/html') || ct.startsWith('application/xml+xhtml') || ct.startsWith('application/xhtml+xml')) {
          req.session.fetchURL = urlHost
          serverResponse = body.toString()
          .replace(/xhttp.open\("GET",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("GET",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(/xhttp.open\("POST",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("POST",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(/xhttp.open\("OPTIONS",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("OPTIONS",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')

          .replace(/xhr.open\("GET",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("GET",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(/xhr.open\("POST",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("POST",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(/xhr.open\("OPTIONS",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("OPTIONS",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(/ajax\("http(.*?)"\)/gi, 'ajax("/alloy/url/http' + '$1' + '")')
          .replace(/window.location.hostname/gi, `"${locationHostname}"`)
           .replace(/location.hostname/gi, `"${locationHostname}"`)
          .replace(/<title>(.*?)<\/title>/gi, '<title>Alloy</title>')
          .replace(new RegExp(/integrity="(.*?)"/gi), '')
          .replace(new RegExp(/nonce="(.*?)"/gi), '')          
          .replace(/src="\/\//gi, 'src="http://')
          .replace(/href="\/\//gi, 'href="http://')
          .replace(/action="\/\//gi, 'action="http://')
          .replace(/data="\/\//gi, 'data="http://')
          .replace(/src='\/\//gi, "src='http://")
          .replace(/href='\/\//gi, "href='http://")
          .replace(/action='\/\//gi, "action='http://")
          .replace(/data='\/\//gi, "data='http://")

          

          .replace(/src="\//gi, 'src="/fetch/' + urlHost + '/')
          .replace(/href="\//gi, 'href="/fetch/' + urlHost + '/')
          .replace(/action="\//gi, 'action="/fetch/' + urlHost + '/')
          .replace(/data="\//gi, 'data="/fetch/' + urlHost + '/')
          .replace(/src='\//gi, "src='/fetch/" + urlHost + '/')
          .replace(/href='\//gi, "href='/fetch/" + urlHost + '/')
          .replace(/action='\//gi, "action='/fetch/" + urlHost + '/')
          .replace(/data='\//gi, "data='/fetch/" + urlHost + '/')

        
          .replace(/src="http/gi, 'src="/alloy/url/http')
          .replace(/href="http/gi, 'href="/alloy/url/http')
          .replace(/action="http/gi, 'action="/alloy/url/http')
          .replace(/data="http/gi, 'action="/alloy/url/http')
          .replace(/"(?!.*\/fetch\/)http:\/\/(.*?)"/gi, '"/alloy/url/http://' + '$1' + '"')
          .replace(/"(?!.*\/fetch\/)https:\/\/(.*?)"/gi, '"/alloy/url/https://' + '$1' + '"')

          .replace(/'(?!.*\/fetch\/)http:\/\/(.*?)'/gi, "'/alloy/url/http://" + '$1' + "'")
          .replace(/'(?!.*\/fetch\/)https:\/\/(.*?)'/gi, "'/alloy/url/https://" + '$1' + "'")
          .replace(/<html(.*?)>/gi, '<html'  + '$1'  + '><script id="alloyData" data-alloyURL="' + urlHost + '"' + ' src="/alloy/static/xml.js"></script><script src="/alloy/static/url.js"></script>')
          .replace(/url\(\/\//gi, 'url(http://')
          .replace(/url\("\//gi, 'url("' + '/fetch/' + urlHost + '/')
          .replace(/url\('\//gi, "url('" + '/fetch/' + urlHost + '/')
          .replace(/url\('http/gi, "url('/alloy/url/http")
          .replace(/url\("http/gi, 'url("/alloy/url/http')
          .replace(/url\(http/gi, "url(/alloy/url/http")
         .replace(/"\/alloy\/url\/(.*?)"/gi,  function (str) {
            const Data = str.split(`"`).splice(1)
            Data.pop()
            return `"/fetch/${rewritingURL(Data.join(`"`).toString().replace('/alloy/url/', ''))}"`
          })
           .replace(/'\/alloy\/url\/(.*?)'/gi,  function (str) {
            const Data = str.split(`'`).splice(1)
            Data.pop()
            return `'/fetch/${rewritingURL(Data.join(`'`).toString().replace('/alloy/url/', ''))}'`
          })
           if (fullURL.startsWith('https://discord.com')) {
          serverResponse = serverResponse.replace(`WEBAPP_ENDPOINT: '//discord.com'`,`WEBAPP_ENDPOINT: '//${req.hostname}/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ=='`)
          .replace("ASSET_ENDPOINT: 'https://discord.com',", `ASSET_ENDPOINT: 'https://${req.hostname}/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==',`)
          .replace("MIGRATION_DESTINATION_ORIGIN: 'https://discord.com',", `MIGRATION_DESTINATION_ORIGIN: 'https://${req.hostname}/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==',`)
          .replace("NETWORKING_ENDPOINT: '//router.discordapp.net',", `NETWORKING_ENDPOINT: '//${req.hostname}/fetch/aHR0cHM6Ly9yb3V0ZXIuZGlzY29yZGFwcC5uZXQ=',`)
          .replace("API_ENDPOINT: '//discord.com/api',", `API_ENDPOINT: '//${req.hostname}/api',`)
        }
        } else if (ct.startsWith('text/css')) {
          serverResponse = body.toString()      
          .replace(/url\(\/\//gi, 'url(http://')
          .replace(/url\("\//gi, 'url("' + '/fetch/' + urlHost + '/')
          .replace(/url\('\//gi, "url('" + '/fetch/' + urlHost + '/')
          .replace(/url\('http/gi, "url('/alloy/url/http")
          .replace(/url\("http/gi, 'url("/alloy/url/http')
          .replace(/url\(http/gi, "url(/alloy/url/http")
        } else if (ct.startsWith('text/javascript') || ct.startsWith('application/javascript')) {
           serverResponse = body.toString()
           .replace(/xhttp.open\("GET",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("GET",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
           .replace(/xhttp.open\("POST",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("POST",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
           .replace(/xhttp.open\("OPTIONS",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("OPTIONS",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')

           .replace(/xhr.open\("GET",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("GET",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
           .replace(/xhr.open\("POST",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("POST",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
           .replace(/xhr.open\("OPTIONS",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("OPTIONS",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
           .replace(/ajax\("http:\/\/(.*?)"\)/gi, 'ajax("/alloy/url/http://' + '$1' + '")')
           .replace(/ajax\("https:\/\/(.*?)"\)/gi, 'ajax("/alloy/url/https://' + '$1' + '")')
        }          
            res.send(serverResponse)
      })();
    if (req.url == ('/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==/')) {
      res.redirect('/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==/login')
    }
})

app.use('/alloy/static/', express.static('static'))

app.use('/alloy/url/',function (req, res, next) {
  const mainurl = req.url.split('/').slice(1).join('/')
  const host = mainurl.split('/').slice(0, 3).join('/')
  const buff = new Buffer(host);
  const host64 = buff.toString('base64');
  const path = mainurl.split('/').slice(3).join('/')
  console.log(host64)
  console.log(path)
  const fullURL = host64 +  '/' + path
  res.redirect(307, '/fetch/' +  fullURL)
})

app.use('/alloy/rv/', function (req, res ,next) {
  const reversemode = url.parse(req.url, true).query.rv
  const externalContent = url.parse(req.url, true).query.exter

  if (reversemode) {
    const host = reversemode.split('/').slice(0, 3).join('/')
    const path = reversemode.split('/').slice(3).join('/')
    req.session.rvURL = host
    res.redirect(`/rv/${path}`)
  }

  if (externalContent) {
    // We are not getting the values directly from the querystring due to issues with "&" letters
    const queryContent = req.url.split('?exter=').slice(1).join('/')
    console.log(queryContent)
  }
})

app.use('/alloy/',function (req, res, next) {
  const aurl = url.parse(req.url, true).query.url

if (aurl) {
var clientInput = base64Decode(aurl)
var fetchURL;
if (clientInput.startsWith('//')) {
    fetchURL = rewritingURL('http:' + clientInput)
} else if (clientInput.startsWith('http://') || clientInput.startsWith('https://')) {
   fetchURL = rewritingURL(clientInput)
} else {
   fetchURL = rewritingURL('http://' + clientInput)
}
  res.redirect(307, '/fetch/' + fetchURL)
} else return res.send('Static')
})



app.use(function (req, res, next) { 
if (req.url == '/') {
   return fs.createReadStream('public/index.html').pipe(res)
} else if (req.cookies['option'] == 'normal') {
    res.redirect(307, '/fetch/' + req.session.fetchURL + req.url)
} else if (req.cookies['option'] == 'reverse') {
    res.redirect(307, `/rv${req.url}`)
} else return fs.createReadStream('public/404.html').pipe(res)
});
