# Alloy Proxy

A powerful web proxy!

# How to install and use:

`git clone https://github.com/titaniumnetwork-dev/alloyproxy.git`

`cd alloyproxy`

`npm install`

`npm start`

The default place for the proxy when its started is `https://localhost:443` but feel free to change it in the feature

# How the proxy works:

The proxy works by using node-fetch (Basically Window.fetch ported to Node-js). 
Basically what the app is doing is node-fetch is sending the request to the server then
the app sends the response back to the server with the modifactions made to the attributes and elements.

When a attribute is rewritten, depending on the contents inside. It will turn:

`href="/assets/js/main.js"` into `href="/fetch/websiteURL/assets/js/main.js"`.

A porition of its rewriting is in client-side JS so `Element.setAttribute`, `window.fetch()`, XMLHttpRequest, and more are rewritten.


# Updates to come in the future

- Reverse proxy mode

- Full URL encoding / encryption mode
