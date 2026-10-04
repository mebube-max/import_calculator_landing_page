import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1');const path=decodeURIComponent(url.pathname);let file=resolve(root,'.'+path);if(file!==root&&!file.startsWith(root+'/')){res.writeHead(403);res.end('Forbidden');return}if(path==='/'||!extname(path))file=resolve(root,'index.html');const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}});
server.on('error',e=>{if(e.code==='EADDRINUSE'){console.log('Port 5174 is already in use. If Zolan is running, open http://127.0.0.1:5174/.')}else console.error(e.message);process.exitCode=1});
server.listen(5174,'127.0.0.1',()=>console.log('Ready: http://127.0.0.1:5174/ (Ctrl+C stops the server)'));
