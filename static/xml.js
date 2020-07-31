   let oldXHROpen = window.XMLHttpRequest.prototype.open;window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    // do something with the method, url and etc.
    this.addEventListener('load', function() {
        if (url.startsWith('http')) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, '/alloy/url/' + url, [async, user, password])
        xhr.send();
        } else if (url.startsWith('//')) {
            let xhr = new XMLHttpRequest();
            xhr.open(method, '/alloy/url/' + url.toString().replace('//', 'http://'), [async, user, password])
            xhr.send();
         } 
    });
                  
    return oldXHROpen.apply(this, arguments);
   }

