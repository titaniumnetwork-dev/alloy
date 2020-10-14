# Alloy Proxy

A node.js proxy that features URL encoding, and amazing compatablity!

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/titaniumnetwork-dev/alloyproxy/)
[![Run on Repl.it](https://repl.it/badge/github/titaniumnetwork-dev/alloyproxy)](https://repl.it/github/titaniumnetwork-dev/alloyproxy)

# How to install and use:

`git clone https://github.com/titaniumnetwork-dev/alloyproxy.git`

`cd alloyproxy`

`npm install`

`npm start`

The default prefix for Alloy Proxy will is "/proxy/" but you are free to change this in "config.json" alongside the port.

# How the proxy works:

The proxy works by using node-fetch (Basically Window.fetch ported to Node-js). 
Basically what the app is doing is node-fetch is sending the request to the server then
the app sends the response back to the server with the modifactions made to the attributes and elements.

When a attribute is rewritten, depending on the contents inside. It will turn:

`href="/assets/js/main.js"` into `href="/fetch/websiteURL/assets/js/main.js"`.

A porition of its rewriting is in client-side JS so `Element.setAttribute`, `window.fetch()`, XMLHttpRequest, and more are rewritten.

# Recommended Nginx config.
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



# Implementing your website in Alloyproxy

To implement your website into AlloyProxy. Upload all of your files into the `public` folder then your done.

# Blacklisting websites!

If you don't want certain websites such as porn websites to be accessed.
You can add a websites hostname to `blocklist.json`.
A websites hostname is the URL of a website without any protocol, port, or path.

For example:

"https://discord.com/dsa/asd/sad/" = "discord.com",

"https://www.example.org:8080/dsa/dsa/dsa/" = "www.example.org".

Take this as an example for a good blocklist:

```
[
"www.example.org",
"www.example.com",
"www.example.info"
]
```

# Things not to do

We recommend NOT to delete the `utils` folder. It contains script injection and error pages. And don't tamper with any rewriting that adds script injection since script injection makes websites such as Discord and Youtube work more properly.

# Extra information:

If your gonna have an external website redirect to this proxy. Then we recommend you have the value base64 encoded and redirected to `[PROXY_PREFIX]/utils/?url=` then value.

# Deploying to Heroku:

If your gonna be hosting this on something like Heroku. You need to make sure SSL mode is turned off so this will work.

# Known websites that work

- Google Search

- Discord

- LittleBigSnake

- Surviv.io

- Youtube

- Y8

- 1v1.LOL

- Old Reddit

and plenty more!


# Updates to come in the future

- Full URL encoding / encryption mode

- Websocket proxing
