# AlloyProxy
Module specialized in proxying websites to unblock the web.

# How to use

1. `npm install alloyproxy`

2. Set all of your configs in the main file for the Node app.

3. Start up your app and unblock a website at `/prefix/[BASE64 ENCODED WEBSITE ORIGIN]/`. The path of the website does not have to be B64 encoded.

A good example of what code to use is here using the Express.js framework.

If you're a beginner then I recommend you use this snippet of code!

```

// Note: make sure you use Alloy before any other Express middleware that sends responses to client or handles POST data. 

const Alloy = require('alloyproxy'),
    http = require('http'),
    express = require('express'),
    app = express();
    
const server = http.createServer(app);   

const Unblocker = new Alloy({
    prefix: '/fetch/',
    request: [],
    response: [],
    injection: true,
});    
 
// The main part of the proxy. 
 
app.use(Unblocker.app);    

// WebSocket handler.

Unblocker.ws(server);    

server.listen('8080')

```

# Configurations

```
{
    prefix: '/prefix/',
    blocklist: [],
    // error: (proxy) => { return res.end('proxy.error.info.message') },  Custom error handling which is optional.
    request: [], // Add custom functions before request is made or modify the request.
    response: [], // Add custom functions after the request is made or modify the response.
    injection: true, // Script injection which is helpful in rewriting window.fetch() and all kinds of client-side JS requests.
    requestAgent: null, // Set a custom agent to use in the request.
    // userAgent: Uses the clients "User-Agent" request header by default. More customizable using the "request" option in the configs.
    localAddress: [] // Neat feature in basic http(s).request() to choose what IP to use to make the request. Will be randomized if there is multiple.
}    
```

# How to use "request" and "response" options in the config.

To use the "request" and "response" options in the config. You must make a function like this for example.

```
customFunction = (proxy) => {

  if (proxy.url.hostname == 'example.org' && proxy.response.headers['content-type'].startsWith('text/html')) {
  
    return proxy.sendResponse == proxy.sendResponse.toString().replace(/example/gi, 'cat :3');
  
  };

};

new Alloy({
prefix: '/prefix/',
blocklist: [],
// error: (proxy) => { return res.end('proxy.error.info.message') },  Custom error handling which is optional.
request: [], // Add custom functions before request is made or modify the request.
response: [
    
  customFunction
    
], // Add custom functions after the request is made or modify the response.
injection: true, // Script injection which is helpful in rewriting window.fetch() and all kinds of client-side JS requests.
requestAgent: null, // Set a custom agent to use in the request.
// userAgent: Uses the clients "User-Agent" request header by default. More customizable using the "request" option in the configs.
localAddress: [] // Neat feature in basic http(s).request() to choose what IP to use to make the request. Will be randomized if there is multiple.
})
```

What this will do is when the hostname of a website being accessed is `example.org`. The keyword "example" would be replaced with "cat :3".

```

// Basic HTTP functions.

proxy.req // This is the request option in HTTP servers. If Express.js is being used, you can use Express.js functions.
proxy.res // This is the response option in HTTP servers. If Express.js is being used, you can use Express.js functions.
proxy.next() // This is only avaliable in Express.js . If used in native HTTP, the app will display blank text as a filler.

// Request

proxy.request.headers // A modified version of the client's request headers used in sending the request.
proxy.request.method // The clients request method.
proxy.request.body // The POST body of a POST / PATCH request. 

// Response

proxy.response // The entire response of the website. Contains headers, JSON / text response, and all Node.js http(s).request() response data.
proxy.response.headers // Response headers the website gave back. Is modified to filter out bad headers, and rewrite "Set-Cookie" header.
proxy.sendResponse // The modified response buffer the website gave back. You can modify it in anyway you desire. :)

// Errors

proxy.error.status // Outputs "true" when theres an error.
proxy.error.info // Gives information about an error.
proxy.error.info.code // Gives error code. Error codes such as "ENOTFOUND" mean a website could not be found. "BLOCKED" means a website is blocked.
proxy.error.info.message // Gives error message.
proxy.blocked.status // Outputs "true" when a filtered hostname is detected.


```

# Websocket Proxy

Alloy does come with a built in websocket proxy. To use it, you must have an HTTP server already defined. The example of using Alloy as Express middleware already uses the websocket proxy.

# Using Nginx or Apache for proxying.

A reminder that if your using Nginx / Apache for proxying this, then the websocket proxy will not work without `Connection` and `Upgrade` headers.

Nginx config example:

```
location / {

    proxy_set_header Accept-Encoding "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Host $host:$server_port;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # These headers are necessary for the WebSocket proxy to work.
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";        
    proxy_pass http://url-to-alloy:8080;
   
} 
```

Apache config needs to be added. 






