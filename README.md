# AlloyProxy
Module specialized in proxying websites to unblock the web.

# How to use

1. `npm install alloyproxy`

2. Set all of your configs in the main file for the Node app.

3. Start up your app and unblock a website at `/prefix/[BASE64 ENCODED WEBSITE ORIGIN]/`. The path of the website does not have to be B64 encoded.

# Configurations

```
    prefix: '/prefix/',
    blocklist: [],
    // error: (proxy) => { return res.end('proxy.error.info.message') },  Custom error handling which is optional.
    request: [], // Add custom functions before request is made or modify the request.
    response: [], // Add custom functions after the request is made or modify the response.
    injection: true, // Script injection which is helpful in rewriting window.fetch() and all kinds of client-side JS requests.
    requestAgent: null, // Set a custom agent to use in the request.
    // userAgent: Uses the clients "User-Agent" request header by default. More customizable using the "request" option in the configs.
    localAddress: [] // Neat feature in basic http(s).request() to choose what IP to use to make the request. Will be randomized if there is multiple.
```


