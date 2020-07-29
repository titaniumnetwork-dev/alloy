// To do list
// load balancing 
// websocket url rewriting
//1. Make it define whats "/get?=https://example.org/" for hrefs and srcs that start with /

const fetch = require('node-fetch');
const express = require("express");
const url = require('url');
const mime = require('mime-types')
const fs = require('fs')
const cookieParser = require('cookie-parser');
const http = require('http');
const https = require('https');
const path = require('path');
const websocket = require('ws');

const app = express();

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

app.get('/fetch/*',function (req, res, next) {
    (async () => {        
        
        const httpAgent = new http.Agent({
            keepAlive: true
          });
          const httpsAgent = new https.Agent({
            keepAlive: true
          });
          const options = {
            method: req.method,
            agent: function(_parsedURL) {
              if (_parsedURL.protocol == 'http:') {
                return httpAgent;
              } else {
                return httpsAgent;
              }
            }
          };

        const url = req.url.split('/').slice(2).join('/').replace(/(^:)\/\//, '/')
 
        const burl = req.url.split('/').slice(2).slice(0, 3).join('/')


        const testURL = req.url.split('/').slice(2).slice(0, 1).join('/')
        const buff = new Buffer(testURL, 'base64');
        const text = buff.toString('ascii');
        const testURL2 = req.url.split('/').slice(2)
        testURL2.shift()
        const testURLpath = testURL2.join('/')
        console.log(text)
        console.log(testURLpath)
        const fullURL = text + '/' + testURLpath
 
        res.cookie('option', 'normal', { maxAge: 256000 });
        res.cookie('origin', testURL, { maxAge: 256000 });
        const response = await fetch(fullURL.replace(/(^:)\/\//, '/'), options).catch(err => fs.createReadStream('public/404.html').pipe(res));
        const body = await response.buffer()
        // console.log(body);
        var ct = 'notset'
        response.headers.forEach((e, i, a) => {
          if (i == 'content-type') ct = e;
        });
        if (ct == null || typeof ct == 'undefined') ct = 'text/html';
        res.contentType(ct);
        if (ct.startsWith('text/html') || ct.startsWith('application/xml+xhtml') || ct.startsWith('application/xhtml+xml')) {
          const textRewrite = body.toString()
          .replace(new RegExp(/integrity="(.*?)"/gi), '')
          .replace(new RegExp(/nonce="(.*?)"/gi), '')          
          .replace(/src="\/\//gi, 'src="http://')
          .replace(/href="\/\//gi, 'href="http://')
          .replace(/action="\/\//gi, 'action="http://')
          


          .replace(/src="\//gi, 'src="/fetch/' + testURL + '/')
          .replace(/href="\//gi, 'href="/fetch/' + testURL + '/')
          .replace(/action="\//gi, 'action="/fetch/' + testURL + '/')
        
          .replace(/src="http/gi, 'src="/alloy/?url=http')
          .replace(/href="http/gi, 'href="/alloy/?url=http')
          .replace(/action="http/gi, 'action="/alloy/?url=http')
          .replace(/"(?!.*\/fetch\/)http:\/\/(.*?)"/gi, '"/alloy/?url=http://' + '$1' + '"')
          .replace(/"(?!.*\/fetch\/)https:\/\/(.*?)"/gi, '"/alloy/?url=https://' + '$1' + '"')

          .replace(/'(?!.*\/fetch\/)http:\/\/(.*?)'/gi, "'/alloy/?url=http://" + '$1' + "'")
          .replace(/'(?!.*\/fetch\/)https:\/\/(.*?)'/gi, "'/alloy/?url=https://" + '$1' + "'")
          

          .replace(/"(?!.*\/fetch\/)http:\\\/\\\/(.*?)"/gi, '"\/alloy\/?url=http:\/\/' + '$1' + '"')
          .replace(/"(?!.*\/fetch\/)https:\\\/\\\/(.*?)"/gi, '"\/alloy/?url=https:\/\/' + '$1' + '"')
          .replace(/'(?!.*\/fetch\/)http:\\\/\\\/(.*?)'/gi, "'\/alloy\/?url=http:\/\/" + '$1' + "'")
          .replace(/'(?!.*\/fetch\/)https:\\\/\\\/(.*?)'/gi, "'\/alloy\/?url=https:\/\/" + '$1' + "'")
          
          // Discord endpoint rewrites

          .replace(/'cdn.discordapp.com'/gi,  "'" + req.hostname + "/fetch/aHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20=" + "'")
          
          res.send(textRewrite)
        } else if (ct.startsWith('text/css')) {
          const cssRewrite = body.toString()      
          .replace(/url\("\//gi, 'url("' + '/fetch/' + testURL + '/')
          .replace(/url\('\//gi, "url('" + '/fetch/' + testURL + '/')
          .replace(/url\('http/gi, "url('/alloy/?url=http")
          .replace(/url\("http/gi, 'url("/alloy/?url=http')
          .replace(/url\(http/gi, "url(/alloy/?url=http")
          res.send(cssRewrite)
        } else if (ct.startsWith('text/javascript') || ct.startsWith('application/javascript')) {
          const jsRewrite = body.toString()     
          //.replace(/"(?!.*\/fetch\/)http:\/\/(.*?)"/gi, '"/fetch/http://' + '$1' + '"')
          //.replace(/"(?!.*\/fetch\/)https:\/\/(.*?)"/gi, '"/fetch/https://' + '$1' + '"')
          //.replace(/'(?!.*\/fetch\/)http:\/\/(.*?)'/gi, "'/fetch/http://" + '$1' + "'")
          //.replace(/'(?!.*\/fetch\/)https:\/\/(.*?)'/gi, "'/fetch/https://" + '$1' + "'")

    
          res.send(jsRewrite)
        } else {
          res.send(body)
        }
    
      })();

if (req.url == '/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==/') {
   res.redirect('/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==/login')
}

})


app.use('/reverse/',function (req, res, next) {
    (async () => {        
        
        const httpAgent = new http.Agent({
            keepAlive: true
          });
          const httpsAgent = new https.Agent({
            keepAlive: true
          });
          const options = {
            method: req.method,
            agent: function(_parsedURL) {
              if (_parsedURL.protocol == 'http:') {
                return httpAgent;
              } else {
                return httpsAgent;
              }
            }
          };

        const url = req.url.split('/').slice(2).join('/')
 
        res.cookie('option', 'reverse', { maxAge: 256000 });
        const response = await fetch(req.cookies['rURL'] + req.url.replace('\/reverse\/', '/'), options).catch(err => fs.createReadStream('public/404.html').pipe(res));
        const body = await response.buffer()
        // console.log(body);
        var ct = 'notset'
        response.headers.forEach((e, i, a) => {
          if (i == 'content-type') ct = e;
        });
        if (ct == null || typeof ct == 'undefined') ct = 'text/html';
        res.contentType(ct);
        if (ct.startsWith('text/html') || ct.startsWith('application/xml+xhtml') || ct.startsWith('application/xhtml+xml')) {
          const textRewrite = body.toString()
          .replace(/src="\/\//gi, 'src="http://')
          .replace(/href="\/\//gi, 'href="http://')
          .replace(/action="\/\//gi, 'action="http://')
          


          .replace(/src="\//gi, 'src="/reverse/')
          .replace(/href="\//gi, 'href="/reverse/')
          .replace(/action="\//gi, 'action="/reverse/')
        
          .replace(/src="http/gi, 'src="/fetch/http')
          .replace(/href="http/gi, 'href="/fetch/http')
          .replace(/action="http/gi, 'action="/fetch/http')

          res.send(textRewrite)
        } else if (ct.startsWith('text/css')) {
          const cssRewrite = body.toString()      
            
          res.send(cssRewrite)
        } else if (ct.startsWith('text/javascript') || ct.startsWith('application/javascript')) {
          const jsRewrite = body.toString()     
          
    
          res.send(jsRewrite)
        } else {
          res.send(body)
        }
    
      })();
})

app.use('/alloy/',function (req, res, next) {
const aurl = url.parse(req.url, true).query.url

if (aurl) {
   const host = aurl.split('/').slice(0, 3).join('/')
   const buff = new Buffer(host);
   const host64 = buff.toString('base64');
   const path = aurl.split('/').slice(3).join('/')
   console.log(host64)
   console.log(path)
   const fullURL = host64 +  '/' + path
   res.redirect('/fetch/' +  fullURL)
}

})


app.use(function (req, res, next) { 
if (req.url == '/') {
   return fs.createReadStream('public/index.html').pipe(res)
} else if (req.cookies['option'] == 'normal') {
    res.redirect('/fetch/' + req.cookies['origin'] + req.url)
} else if (req.cookies['option'] == 'reverse') {
    res.redirect('/reverse' + req.url)
} else return fs.createReadStream('public/404.html').pipe(res)
});

app.listen(8080);