// To do list
// load balancing 
// websocket url rewriting
//1. Make it define whats "/get?=https://example.org/" for hrefs and srcs that start with /

const fetch = require('node-fetch');
const express = require("express");
const url = require('url');
const fs = require('fs')
const cookieParser = require('cookie-parser');
const http = require('http');
const https = require('https');
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

var wss = new websocket.Server({
  server: server,
}), conns = 0;

require('./ws.js')(wss, conns);


app.use(cookieParser());

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
              'Content-Security-Policy': ''
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

        const url = req.url.split('/').slice(2).join('/').replace(/(^:)\/\//, '/')
 
        const burl = req.url.split('/').slice(2).slice(0, 3).join('/')


        const testURL = req.url.split('/').slice(1).slice(0, 1).join('/')
        const pathURL = req.url.split('/').slice(2).join('/')
        console.log(pathURL)
        console.log(testURL)
        const buff = new Buffer(testURL, 'base64');
        const text = buff.toString('ascii');
        const testURL2 = req.url.split('/').slice(2)
        testURL2.shift()
        const testURLpath = testURL2.join('/')
        console.log(text)
        console.log(testURLpath)
        const fullURL = text + '/' + pathURL
        console.log(fullURL)
        res.cookie('option', 'normal', { maxAge: 256000 });
        const entireURL = testURL + pathURL
        const response = await fetch(fullURL.replace(/(^:)\/\//, '/'), options).catch(err => fs.createReadStream('public/404.html').pipe(res));
        const body = await response.buffer()
        var ct = 'notset'
        const location = response.headers.get("Location");

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
        if (ct == null || typeof ct == 'undefined') ct = 'text/html';
        res.contentType(ct);
        if (ct.startsWith('text/html') || ct.startsWith('application/xml+xhtml') || ct.startsWith('application/xhtml+xml')) {
          res.cookie('origin', testURL, { maxAge: 256000 });
          const textRewrite = body.toString()
          .replace(/xhttp.open\("GET",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("GET",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(/xhttp.open\("POST",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("POST",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(/xhttp.open\("OPTIONS",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("OPTIONS",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')

          .replace(/xhr.open\("GET",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("GET",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(/xhr.open\("POST",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("POST",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(/xhr.open\("OPTIONS",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("OPTIONS",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
          .replace(new RegExp(`"${text}(.*?)"`), '"' + '$1' + '"')
          .replace(/<title>(.*?)<\/title>/gi, '')
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

          

          .replace(/src="\//gi, 'src="/fetch/' + testURL + '/')
          .replace(/href="\//gi, 'href="/fetch/' + testURL + '/')
          .replace(/action="\//gi, 'action="/fetch/' + testURL + '/')
          .replace(/data="\//gi, 'data="/fetch/' + testURL + '/')
          .replace(/src='\//gi, "src='/fetch/" + testURL + '/')
          .replace(/href='\//gi, "href='/fetch/" + testURL + '/')
          .replace(/action='\//gi, "action='/fetch/" + testURL + '/')
          .replace(/data='\//gi, "data='/fetch/" + testURL + '/')

        
          .replace(/src="http/gi, 'src="/alloy/url/http')
          .replace(/href="http/gi, 'href="/alloy/url/http')
          .replace(/action="http/gi, 'action="/alloy/url/http')
          .replace(/data="http/gi, 'action="/alloy/url/http')
          .replace(/"(?!.*\/fetch\/)http:\/\/(.*?)"/gi, '"/alloy/url/http://' + '$1' + '"')
          .replace(/"(?!.*\/fetch\/)https:\/\/(.*?)"/gi, '"/alloy/url/https://' + '$1' + '"')

          .replace(/'(?!.*\/fetch\/)http:\/\/(.*?)'/gi, "'/alloy/url/http://" + '$1' + "'")
          .replace(/'(?!.*\/fetch\/)https:\/\/(.*?)'/gi, "'/alloy/url/https://" + '$1' + "'")
          .replace(/"(?!.*\/fetch\/)(?!.*\/alloy\/url\/\/)(.*?).googlevideo.com/gi, '"\\\/alloy\\\/url\\\/' + '$1' + '.googlevideo.com')
          .replace(/'cdn.discordapp.com'/gi,  "'" + req.hostname + "/fetch/aHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20=" + "'")

           
         // if (fullURL == 'https://discord.com/' + pathURL) {
          //const discRewrite = body.toString()
          //.replace(/'cdn.discordapp.com'/gi,  "'" + req.hostname + "/fetch/aHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20=" + "'")
          //.replace(new RegExp(/integrity="(.*?)"/gi), '')
          //.replace(new RegExp(/nonce="(.*?)"/gi), '')    
          //.replace(/MARKETING_ENDPOINT: '\/\/discord.com'/gi, `MARKETING_ENDPOINT: '//${req.hostname}/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==',`)
          //.replace(/MIGRATION_DESTINATION_ORIGIN: 'https:\/\/discord.com'/gi, `MIGRATION_DESTINATION_ORIGIN: '/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ'`)
          //.replace(/MIGRATION_SOURCE_ORIGIN: 'https:\/\/discordapp.com'/gi, `MIGRATION_SOURCE_ORIGIN: '/fetch/aHR0cHM6Ly9kaXNjb3JkYXBwLmNvbQ=='`)
          //res.send(discRewrite)
          //}
          
          res.send(textRewrite)
        } else if (ct.startsWith('text/css')) {
          const cssRewrite = body.toString()      
          .replace(/url\("\//gi, 'url("' + '/fetch/' + testURL + '/')
          .replace(/url\('\//gi, "url('" + '/fetch/' + testURL + '/')
          .replace(/url\('http/gi, "url('/alloy/url/http")
          .replace(/url\("http/gi, 'url("/alloy/url/http')
          .replace(/url\(http/gi, "url(/alloy/url/http")
          res.send(cssRewrite)
        } else if (ct.startsWith('text/javascript') || ct.startsWith('application/javascript')) {
           const jsRewrite = body.toString()
           .replace(/xhttp.open\("GET",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("GET",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
           .replace(/xhttp.open\("POST",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("POST",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
           .replace(/xhttp.open\("OPTIONS",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhttp.open("OPTIONS",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')

           .replace(/xhr.open\("GET",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("GET",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
           .replace(/xhr.open\("POST",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("POST",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')
           .replace(/xhr.open\("OPTIONS",(.*?)"http(.*?)"(.*?),(.*?)true\);/gi, ' xhr.open("OPTIONS",' + '$1' + '"/alloy/url/http' + '$2' + '"' + '$3' + ',' + '$4' + 'true')

           res.send(jsRewrite)
        } else {
          res.send(body)
        }
    
      })();

if (req.url == '/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==/') {
   res.redirect('/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==/login')
}

})


// NOT READY YET REVERSE PROXY MODE IS NOT READY YET
app.use('/rv/',function (req, res, next) {
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
          'User-Agent': req.headers['user-agent']
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

        const url = req.url.split('/').slice(2).join('/')
 
        res.cookie('option', 'reverse', { maxAge: 256000 });
        const response = await fetch(req.cookies['rURL'] + req.url.replace('\/reverse\/', '/'), options).catch(err => fs.createReadStream('public/404.html').pipe(res));
        const body = await response.buffer()
        const location = response.headers.get("Location");
      if (req.cookies) {
        const host = location.split('/').slice(0, 3).join('/')
        const path = location.split('/').slice(3).join('/')
        res.cookie('rURL', location, { maxAge: 256000 });
        res.redirect('/reverse/' + path)
      }
        // console.log(body);
        var ct = 'notset'
        response.headers.forEach((e, i, a) => {
          if (i == 'content-type') ct = e;
        });
        if (ct == null || typeof ct == 'undefined') ct = 'text/html';
        res.contentType(ct);
        if (ct.startsWith('text/html') || ct.startsWith('application/xml+xhtml') || ct.startsWith('application/xhtml+xml')) {
          const textRewrite = body.toString()
          .replace(new RegExp(`"${req.cookies['rURL']}(.*?)"`), '"' + '$1' + '"')
          .replace(/<title>(.*?)<\/title>/gi, '')
          .replace(new RegExp(/integrity="(.*?)"/gi), '')
          .replace(new RegExp(/nonce="(.*?)"/gi), '')          
          .replace(/src="\/\//gi, 'src="http://')
          .replace(/href="\/\//gi, 'href="http://')
          .replace(/action="\/\//gi, 'action="http://')
          


          .replace(/src="\//gi, 'src="/rv/')
          .replace(/href="\//gi, 'href="/rv/')
          .replace(/action="\//gi, 'action="/rv/')
        
          .replace(/src="http/gi, 'src="/alloy/url/http')
          .replace(/href="http/gi, 'href="/alloy/url/http')
          .replace(/action="http/gi, 'action="/alloy/url/http')
          .replace(/"(?!.*\/fetch\/)http:\/\/(.*?)"/gi, '"/alloy/url/http://' + '$1' + '"')
          .replace(/"(?!.*\/fetch\/)https:\/\/(.*?)"/gi, '"/alloy/url/https://' + '$1' + '"')

          .replace(/'(?!.*\/fetch\/)http:\/\/(.*?)'/gi, "'/alloy/url/http://" + '$1' + "'")
          .replace(/'(?!.*\/fetch\/)https:\/\/(.*?)'/gi, "'/alloy/url/https://" + '$1' + "'")
           
          .replace(/'cdn.discordapp.com'/gi,  "'" + req.hostname + "/fetch/aHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20=" + "'")
          .replace(new RegExp(/integrity="(.*?)"/gi), '')
          .replace(new RegExp(/nonce="(.*?)"/gi), '')    
          //.replace(/MARKETING_ENDPOINT: '\/\/discord.com'/gi, `MARKETING_ENDPOINT: '//${req.hostname}/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ==',`)
          //.replace(/MIGRATION_DESTINATION_ORIGIN: 'https:\/\/discord.com'/gi, `MIGRATION_DESTINATION_ORIGIN: '/fetch/aHR0cHM6Ly9kaXNjb3JkLmNvbQ'`)
          //.replace(/MIGRATION_SOURCE_ORIGIN: 'https:\/\/discordapp.com'/gi, `MIGRATION_SOURCE_ORIGIN: '/fetch/aHR0cHM6Ly9kaXNjb3JkYXBwLmNvbQ=='`)
        
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

// For base64 encoding the websites HTTP Protocall and host
app.use('/alloy/url/',function (req, res, next) {
  const mainurl = req.url.split('/').slice(1).join('/')
  const host = mainurl.split('/').slice(0, 3).join('/')
  const buff = new Buffer(host);
  const host64 = buff.toString('base64');
  const path = mainurl.split('/').slice(3).join('/')
  console.log(host64)
  console.log(path)
  const fullURL = host64 +  '/' + path
  res.redirect('/fetch/' +  fullURL)
})

app.use('/alloy/',function (req, res, next) {
  const aurl = url.parse(req.url, true).query.url
if (aurl) {
const buff = new Buffer(aurl, 'base64');
const uncoded = buff.toString('ascii');
console.log(uncoded)

const host = uncoded.split('/').slice(0, 3).join('/')
  const hbuff = new Buffer(host);
  const host64 = hbuff.toString('base64');
  const path = uncoded.split('/').slice(3).join('/')
  const fullURL = host64 +  '/' + path
  res.redirect('/fetch/' + fullURL)
} else return res.send('Static')

})


app.use(function (req, res, next) { 
if (req.url == '/') {
   return fs.createReadStream('public/index.html').pipe(res)
} else if (req.cookies['option'] == 'normal') {
    res.redirect(307, '/fetch/' + req.cookies['origin'] + req.url)
} else if (req.cookies['option'] == 'reverse') {
    res.redirect(307, '/reverse' + req.url)
} else return fs.createReadStream('public/404.html').pipe(res)
});

app.listen(8080);