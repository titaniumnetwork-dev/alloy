# Alloy Proxy

A powerful web proxy!

# How to install and use:

`git clone https://github.com/titaniumnetwork-dev/alloyproxy.git`

`cd alloyproxy`

`npm install`

`node proxy.js`

The console should log where you could access the proxy at. You could change the port and everything in config.json.

In order to get websockets working, you must have these headers in your Apache / Nginx:

`Upgrade $http_upgrade;`

`Connection "upgrade";`


# Updates to come in the future

- Sessions instead of cookies

- Reverse proxy mode

- Better encoding / encryption
