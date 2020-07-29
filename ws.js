const websocket=require('ws'),
	fs=require('fs'),
	util=require('util');

module.exports=((wss,conns)=>{
	wss.on('connection',(cli, req)=>{
		let ID = String(++ conns).padStart(6, 0);
		let urlflags = { }, _urlflags = req.url
			.split('?').slice(1).join('?')
			.split('&').map(a => {
				let x = a.split('=');
				return [ x[0], x.slice(1).join('=') ]
			});
			console.log(urlflags)
		for(let i=0;i<_urlflags.length;++i) {
			urlflags[_urlflags[i][0]] = _urlflags[i][1];
		}
		if(!('ws' in urlflags)) {
			cli.send('Missing URL Flag `ws`!');
			cli.close(1008);
		}
		var svr = new websocket(urlflags.ws);
		svr.on('error',err=>{
			cli.close(1011); // SERVER ERROR
		});
		cli.on('error',()=>{
			svr.close(1001); // CLOSE_GOING_AWAY
		});
		svr.on('message',msg=>{
			cli.send(msg);
		});
		cli.on('message',msg=>{
			try{
				svr.send(msg);
			}catch(err){
				fs.appendFileSync('err.log',`${util.format(err)}\n`);
			}
		});
		svr.on('close',e=>{
			cli.close(e);
		});
		cli.on('close',e=>{
			try{
				svr.close(e);
			}catch(err){
				fs.appendFileSync('err.log',`${util.format(err)}\n`);
			}
		});
	});
});