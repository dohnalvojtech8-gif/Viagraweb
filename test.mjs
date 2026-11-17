import test from 'node:test';import assert from 'node:assert/strict';import worker from './dist/server/index.js';
const db=new Map();const env={ADMIN_EMAIL:'owner@example.com',BUCKET:{async get(k){return db.has(k)?{json:async()=>JSON.parse(db.get(k))}:null},async put(k,v){db.set(k,v)},async delete(k){db.delete(k)},async claim(k,v){if(db.has(k))return false;db.set(k,JSON.stringify(v));return true},async list({prefix}){return {objects:[...db.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}}}};
const call=(path,body,email,cookie)=>worker.fetch(new Request('https://shop.test/api/'+path,{method:body?'POST':'GET',headers:{origin:'https://shop.test',...(email?{'oai-authenticated-user-email':email}:{}),...(cookie?{cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);
test('public catalog, protected CMS, email sign-in, customer orders and checkout',async()=>{
assert.equal((await call('catalog')).status,200);assert.equal((await call('admin')).status,403);assert.equal((await call('admin',null,'intruder@example.com')).status,403);assert.equal((await call('admin',null,'owner@example.com')).status,200);
const product={id:'test',name:'Zkouška',price:100,variant:'250 g, 500 g'};assert.equal((await call('admin/products',[product],'owner@example.com')).status,200);
assert.equal((await call('admin/content',{heroTitle:'Nový nadpis',showHero:false,shippingPrice:70,codFee:30},'owner@example.com')).status,200);
let catalog=await (await call('catalog')).json();assert.equal(catalog.content.heroTitle,'Nový nadpis');assert.equal(catalog.content.showHero,false);assert.equal(catalog.content.shippingPrice,70);
const orderData={requestId:crypto.randomUUID(),name:'Eva',contact:'eva@example.com',address:'Praha',items:[{id:'test',qty:2,price:1,variant:'250 g'}]};
assert.equal((await call('order',orderData)).status,503);
await call('admin/settings',{email:'orders@example.com',from:'shop@example.com',key:'secret'},'owner@example.com');assert.equal((await (await call('admin',null,'owner@example.com')).json()).settings.key,undefined);
assert.equal((await call('order',{...orderData,items:[{id:'test',qty:-1}]})).status,400);
const original=globalThis.fetch;let sent;globalThis.fetch=async(url,opts)=>{sent=JSON.parse(opts.body);return new Response('{}',{status:200})};
assert.equal((await call('auth/request',{email:'eva@example.com'})).status,200);const token=sent.text.match(/login=([a-f0-9]{64})/)[1];assert.equal((await call('auth/request',{email:'eva@example.com'})).status,429);
const login=await call('auth/verify',{token});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);assert.equal((await call('auth/verify',{token})).status,400);
assert.equal((await call('admin',null,null,cookie)).status,403);
let r=await call('order',orderData,null,cookie);assert.equal(r.status,200);assert.match(sent.text,/CELKEM K ÚHRADĚ: 300\s*Kč/);assert.match(sent.html,/<html lang="cs">/);const myOrders=await (await call('account',null,null,cookie)).json();assert.equal(myOrders.orders.length,1);assert.equal(myOrders.orders[0].total,300);
let previous=sent;assert.equal((await call('order',orderData,null,cookie)).status,200);assert.equal(sent,previous);
const adminOrders=await (await call('admin',null,'owner@example.com')).json();assert.equal(adminOrders.orders.length,1);assert.equal((await call('admin/order-status',{id:orderData.requestId,status:'Odeslaná'},'owner@example.com')).status,200);
assert.equal((await call('account')).status,401);
await call('auth/logout',{},null,cookie);assert.equal((await call('account',null,null,cookie)).status,401);
globalThis.fetch=async()=>new Response('{}',{status:500});assert.equal((await call('order',{...orderData,requestId:crypto.randomUUID()})).status,502);globalThis.fetch=original;
const csrf=await worker.fetch(new Request('https://shop.test/api/admin/content',{method:'POST',headers:{origin:'https://evil.test','oai-authenticated-user-email':'owner@example.com'},body:'{}'}),env);assert.equal(csrf.status,403);
});

test('one-use admin setup, password login and test-only checkout',async()=>{
 env.ADMIN_SETUP_TOKEN='a'.repeat(64);env.ADMIN_SETUP_EXPIRES=String(Date.now()+3600000);
 assert.equal((await call('auth/setup',{token:'wrong',password:'long-test-password'})).status,403);
 let response=await call('auth/setup',{token:env.ADMIN_SETUP_TOKEN,password:'long-test-password'});assert.equal(response.status,200);
 let cookie=response.headers.get('set-cookie').split(';')[0];assert.equal((await call('admin',null,null,cookie)).status,200);
 assert.equal((await call('auth/setup',{token:env.ADMIN_SETUP_TOKEN,password:'another-password'})).status,409);
 assert.equal((await call('auth/password',{email:'owner@example.com',password:'wrong-password'})).status,401);
 response=await call('auth/password',{email:'owner@example.com',password:'long-test-password'});assert.equal(response.status,200);
 const passwordRecord=[...db.entries()].find(([k])=>k.startsWith('passwords/'))[1];assert.ok(!passwordRecord.includes('long-test-password'));
 env.TEST_MODE='true';const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Demo must not send order emails')};
 response=await call('order',{requestId:crypto.randomUUID(),name:'Test',contact:'test@example.com',address:'Demo',items:[{id:'test',qty:1,variant:'250 g'}]});assert.equal(response.status,200);assert.equal((await response.json()).test,true);globalThis.fetch=original;env.TEST_MODE='false';
});

test('order emails format prices, escape customer input and hide empty sections',async()=>{
 const {formatOrderEmail}=await import('./worker/index.js');
 const order={id:'12345678-abcd-4000-8000-123456789012',date:'2026-11-17T20:01:00Z',name:'<img src=x onerror=alert(1)>',contact:'a&b@example.com',address:'První řádek\nDruhý řádek',note:'',payment:'Dobírka',items:[{name:'AKU vrtačka',price:799,qty:2,variant:''},{name:'Tělové mléko',price:250,qty:1,variant:'500 ml'}],subtotal:1848,shipping:0,codFee:0,total:1848};
 const e=formatOrderEmail(order,'Můj obchod');assert.match(e.html,/&lt;img/);assert.doesNotMatch(e.html,/<img src=x/);assert.match(e.html,/První řádek<br>Druhý řádek/);assert.match(e.html,/500 ml/);assert.match(e.text,/1\s*848\s*Kč/);assert.doesNotMatch(e.html,/Poznámka zákazníka/);assert.doesNotMatch(e.text,/accountEmail/);assert.match(e.subject,/#12345678/);
 const withNote=formatOrderEmail({...order,note:'Prosím <zavolat>\npředem'});assert.match(withNote.html,/Prosím &lt;zavolat&gt;<br>předem/);assert.match(withNote.text,/POZNÁMKA ZÁKAZNÍKA/);
});
