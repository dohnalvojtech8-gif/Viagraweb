import {createServer} from 'node:http';import worker from './worker/index.js';import {createSupabaseStore} from './database/supabase-store.mjs';
const endpoint=process.env.SHOP_DATABASE_URL,token=process.env.SHOP_DATABASE_TOKEN;
if(!endpoint||!token)throw Error('SHOP_DATABASE_URL and SHOP_DATABASE_TOKEN must be configured.');
const env={...process.env,BUCKET:createSupabaseStore({url:endpoint,token})};
const server=createServer(async(req,res)=>{try{
const origin=process.env.PUBLIC_ORIGIN||process.env.RENDER_EXTERNAL_URL||'http://localhost:'+ (process.env.PORT||3000);
const url=new URL(req.url,origin);if(url.origin!==new URL(origin).origin){res.writeHead(400);return res.end('Invalid URL')}
let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>8*1024*1024){res.writeHead(413);return res.end('Request too large')}chunks.push(c)}
const headers=new Headers();for(const [key,value] of Object.entries(req.headers)){if(!key.startsWith('oai-')&&key!=='host'&&key!=='content-length'&&typeof value==='string')headers.set(key,value)}
// Only Render's forwarded client IP is used for rate limiting; browser identity headers are never trusted.
headers.set('x-real-ip',req.headers['x-forwarded-for']?.split(',').at(-1)?.trim()||req.socket.remoteAddress||'unknown');headers.delete('cf-connecting-ip');
const response=await worker.fetch(new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),env);
res.writeHead(response.status,{...Object.fromEntries(response.headers),'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY'});res.end(Buffer.from(await response.arrayBuffer()));
}catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Služba je dočasně nedostupná.'}))}});
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Shop listening; test mode:',process.env.TEST_MODE==='true'));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
