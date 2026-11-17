import html from './page.js';
import defaults from './content.js';
const seed=[
{id:'1',name:'Hrnek s příběhem',category:'Keramika',price:390,unit:'ks',variant:'250 ml, 350 ml',image:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85',description:'Malý každodenní rituál. Keramický hrnek s přírodní glazurou, který krásně padne do ruky.',gallery:[],showDescription:true,showGallery:true,badge:'Oblíbené'},
{id:'2',name:'Lněná utěrka',category:'Textil',price:240,unit:'ks',variant:'',image:'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85',description:'Přírodní len pro útulný domov.',gallery:[],showDescription:true,showGallery:false,badge:''},
{id:'3',name:'Svíčka Klidný večer',category:'Svíčky',price:320,unit:'ks',variant:'120 g, 200 g',image:'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85',description:'Jemné světlo pro chvíle, které patří jen vám.',gallery:[],showDescription:true,showGallery:false,badge:'Novinka'},
{id:'4',name:'Váza Oblázek',category:'Keramika',price:590,unit:'ks',variant:'',image:'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85',description:'Jednoduchá silueta, která nechá vyniknout každé větvičce.',gallery:[],showDescription:true,showGallery:false,badge:''},
{id:'5',name:'Dřevěné prkénko',category:'Doplňky',price:460,unit:'ks',variant:'',image:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=85',gallery:[],showDescription:false,showGallery:false,badge:''},
{id:'6',name:'Miska na maličkosti',category:'Keramika',price:280,unit:'ks',variant:'',image:'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=900&q=85',gallery:[],showDescription:false,showGallery:false,badge:''}];
const json=(x,status=200,headers={})=>Response.json(x,{status,headers:{'Cache-Control':'no-store',...headers}});
const digest=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
const passwordHash=async(password,salt)=>{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return [...new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:210000,hash:'SHA-256'},key,256))].map(x=>x.toString(16).padStart(2,'0')).join('')};
const validEmail=s=>typeof s==='string'&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export function formatOrderEmail(order,brand='Obchod'){
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(n)||0);
const multiline=s=>escape(s).replace(/\r?\n/g,'<br>');
const reference=String(order.id).slice(0,8).toUpperCase();
const date=new Intl.DateTimeFormat('cs-CZ',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/Prague'}).format(new Date(order.date));
const note=String(order.note||'').trim();
const subject=`Nová objednávka #${reference} · ${money(order.total)}`;
const text=[brand,`NOVÁ OBJEDNÁVKA #${reference}`,`Přijato: ${date}`,`Platba: ${order.payment||'Dobírka'}`,'','ZÁKAZNÍK',`Jméno: ${order.name}`,`Kontakt: ${order.contact}`,`Doručovací adresa: ${order.address}`,'','OBJEDNANÉ PRODUKTY',...order.items.map(i=>`${i.name}${i.variant?' — '+i.variant:''}\n${i.qty} ks × ${money(i.price)} = ${money(i.qty*i.price)}`),'',`Produkty celkem: ${money(order.subtotal)}`,`Doprava: ${money(order.shipping)}`,`Dobírka: ${money(order.codFee)}`,`CELKEM K ÚHRADĚ: ${money(order.total)}`,...(note?['','POZNÁMKA ZÁKAZNÍKA',note]:[]),'',`Číslo objednávky: ${order.id}`].join('\n');
const cell='padding:14px 8px;border-bottom:1px solid #e5e7e1;vertical-align:top;font-size:14px;line-height:1.6;';
const rows=order.items.map(i=>`<tr><td style="${cell}overflow-wrap:anywhere"><strong>${escape(i.name)}</strong>${i.variant?'<br><span style="color:#647067">'+escape(i.variant)+'</span>':''}<br><span style="font-size:12px;color:#647067">${escape(money(i.price))} / ks</span></td><td align="center" style="${cell}width:44px">${escape(i.qty)}×</td><td align="right" style="${cell}width:94px;white-space:nowrap;font-weight:700">${escape(money(i.qty*i.price))}</td></tr>`).join('');
const summary=(label,amount,strong=false)=>`<tr><td style="padding:${strong?'16':'6'}px 0;${strong?'border-top:2px solid #304e3d;font-size:18px;font-weight:700':'font-size:14px;color:#536158'}">${label}</td><td align="right" style="padding:${strong?'16':'6'}px 0;white-space:nowrap;${strong?'border-top:2px solid #304e3d;font-size:20px;font-weight:700':'font-size:14px'}">${escape(money(amount))}</td></tr>`;
const html=`<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(subject)}</title></head><body style="margin:0;padding:0;background:#f3f4ef;color:#263b2f;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">Objednávka #${escape(reference)} · ${escape(order.name)} · ${escape(money(order.total))}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #e5e7e1;border-radius:10px"><tr><td style="padding:24px;background:#304e3d;color:#fff;border-radius:10px 10px 0 0"><div style="font-size:15px;opacity:.85">${escape(brand)}</div><h1 style="font-size:26px;line-height:1.3;margin:12px 0 8px">Nová objednávka</h1><div style="font-size:17px">#${escape(reference)}</div><p style="font-size:13px;line-height:1.6;margin:12px 0 0">${escape(date)}<br>Platba: ${escape(order.payment||'Dobírka')}</p></td></tr><tr><td style="padding:24px"><h2 style="font-size:17px;margin:0 0 14px">Údaje zákazníka</h2><p style="margin:0 0 12px;font-size:15px;line-height:1.6"><span style="font-size:12px;color:#647067">Jméno a příjmení</span><br><strong>${multiline(order.name)}</strong></p><p style="margin:0 0 12px;font-size:15px;line-height:1.6"><span style="font-size:12px;color:#647067">Kontakt</span><br>${multiline(order.contact)}</p><p style="margin:0 0 26px;font-size:15px;line-height:1.6"><span style="font-size:12px;color:#647067">Doručovací adresa</span><br>${multiline(order.address)}</p><h2 style="font-size:17px;margin:0 0 12px">Objednané produkty</h2><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><thead><tr><th align="left" scope="col" style="padding:10px 8px;background:#f3f4ef;font-size:12px">Produkt</th><th scope="col" style="padding:10px 4px;background:#f3f4ef;font-size:12px">Počet</th><th align="right" scope="col" style="padding:10px 8px;background:#f3f4ef;font-size:12px">Celkem</th></tr></thead><tbody>${rows}</tbody></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">${summary('Produkty celkem',order.subtotal)}${summary('Doprava',order.shipping)}${summary('Příplatek za dobírku',order.codFee)}${summary('Celkem k úhradě',order.total,true)}</table>${note?'<h2 style="font-size:17px;margin:24px 0 10px">Poznámka zákazníka</h2><p style="padding:14px;background:#f3f4ef;font-size:14px;line-height:1.7;overflow-wrap:anywhere">'+multiline(note)+'</p>':''}<p style="margin:26px 0 0;font-size:11px;line-height:1.7;color:#647067;overflow-wrap:anywhere">Číslo objednávky: ${escape(order.id)}</p></td></tr></table></td></tr></table></body></html>`;
return {subject,text,html};
}

export default {async fetch(req,env){try{
const u=new URL(req.url);
if(u.pathname==='/health')return json({ok:true});
if(!u.pathname.startsWith('/api/'))return new Response(html,{headers:{'Content-Type':'text/html;charset=utf-8','Referrer-Policy':'same-origin','X-Content-Type-Options':'nosniff'}});
if(!env.BUCKET)return json({error:'Úložiště není připojeno.'},503);
const read=async(k,f)=>{const o=await env.BUCKET.get(k);return o?o.json():f},put=(k,v)=>env.BUCKET.put(k,JSON.stringify(v));
if(req.method!=='GET'&&req.headers.get('origin')!==u.origin)return json({error:'Neplatný původ požadavku.'},403);
const cookie=req.headers.get('cookie')?.match(/(?:^|;\s*)__Host-doma=([a-f0-9]{64})(?:;|$)/)?.[1];
const session=cookie?await read('sessions/'+await digest(cookie),null):null;
const user=session&&session.expires>Date.now()?session:null;
const owner=await read('owner',null),uid=req.headers.get('oai-authenticated-user-id');
// Existing platform owner is accepted only after explicit initialization; never claim a public site.
const adminEmail=env.ADMIN_EMAIL?.trim().toLowerCase();
const platformEmail=req.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
const admin=!!((owner&&uid===owner)||(adminEmail&&((user&&user.email===adminEmail)||platformEmail===adminEmail)));
const content={...defaults,...await read('content',{})};
const getSettings=async()=>{const s=await read('settings',{});return {...s,key:env.RESEND_API_KEY||s.key,from:env.EMAIL_FROM||s.from}};
const email=async(to,subject,text)=>{const s=await getSettings();if(!s.key||!s.from)return false;const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+s.key,'Content-Type':'application/json'},body:JSON.stringify({from:s.from,to:[to],subject,text})});return r.ok};
if(u.pathname==='/api/catalog')return json({products:await read('products',seed),content,admin,testMode:env.TEST_MODE==='true',user:user?{email:user.email}:null});
const startSession=async(emailAddress)=>{const token=random();await put('sessions/'+await digest(token),{email:emailAddress,expires:Date.now()+7*86400000});return json({ok:true},200,{'Set-Cookie':`__Host-doma=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`})};
if(u.pathname==='/api/auth/setup'&&req.method==='POST'){
const b=await req.json();if(!env.ADMIN_SETUP_TOKEN||!env.ADMIN_EMAIL||Number(env.ADMIN_SETUP_EXPIRES)<Date.now()||await digest(String(b.token||''))!==await digest(env.ADMIN_SETUP_TOKEN))return json({error:'Odkaz pro první nastavení je neplatný nebo vypršel.'},403);
if(typeof b.password!=='string'||b.password.length<12||b.password.length>200)return json({error:'Heslo musí mít 12 až 200 znaků.'},400);
const accountKey='passwords/'+await digest(adminEmail);if(await read(accountKey,null))return json({error:'Heslo správce už bylo nastavené. Použijte přihlášení.'},409);
const salt=random(),hash=await passwordHash(b.password,salt);
if(!await env.BUCKET.claim('setup/consumed',{at:new Date().toISOString()}))return json({error:'Tento odkaz už byl použit.'},409);
await put(accountKey,{salt,hash});return startSession(adminEmail);}
if(u.pathname==='/api/auth/password'&&req.method==='POST'){
const b=await req.json(),address=String(b.email||'').trim().toLowerCase();
const ip=req.headers.get('x-real-ip')||'unknown',rateKey='password-rate/'+await digest(ip),rate=await read(rateKey,{count:0,until:0});
if(rate.until>Date.now()&&rate.count>=5)return json({error:'Příliš mnoho pokusů. Zkuste to za 15 minut.'},429);
await put(rateKey,{count:rate.until>Date.now()?rate.count+1:1,until:rate.until>Date.now()?rate.until:Date.now()+15*60000});
const account=await read('passwords/'+await digest(address),null),candidate=await passwordHash(String(b.password||'').slice(0,200),account?.salt||'not-an-account');
if(!account||candidate!==account.hash||address!==adminEmail)return json({error:'Neplatný e-mail nebo heslo.'},401);
await env.BUCKET.delete(rateKey);return startSession(address);}
if(u.pathname==='/api/auth/request'&&req.method==='POST'){
const b=await req.json(),address=String(b.email||'').trim().toLowerCase();if(!validEmail(address))return json({error:'Zadejte platnou e-mailovou adresu.'},400);
const key=await digest(address),limit=await read('auth-rate/'+key,{});
if(limit.next>Date.now())return json({error:'Před dalším zasláním počkejte jednu minutu.'},429);
const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||'unknown',ipKey=await digest(ip),ipLimit=await read('auth-ip/'+ipKey,{count:0,until:0});
if(ipLimit.until>Date.now()&&ipLimit.count>=10)return json({error:'Příliš mnoho pokusů. Zkuste to za hodinu.'},429);
const token=random();await put('auth-rate/'+key,{next:Date.now()+60000});await put('auth-ip/'+ipKey,{count:ipLimit.until>Date.now()?ipLimit.count+1:1,until:ipLimit.until>Date.now()?ipLimit.until:Date.now()+3600000});
await put('tokens/'+await digest(token),{email:address,expires:Date.now()+15*60000});
const ok=await email(address,content.brand+' — přihlášení',`Váš jednorázový přihlašovací odkaz (platí 15 minut):\n${u.origin}/#login=${token}\n\nPokud ještě nemáte účet, po ověření e-mailu ho vytvoříme. Pokud jste o přihlášení nežádali, zprávu ignorujte.`);
if(!ok)return json({error:'Odesílání e-mailů zatím není nastavené nebo není dostupné. Nakoupit můžete bez účtu.'},503);
return json({ok:true});}
if(u.pathname==='/api/auth/verify'&&req.method==='POST'){
const b=await req.json();if(!/^[a-f0-9]{64}$/.test(b.token||''))return json({error:'Neplatný přihlašovací odkaz.'},400);
const key='tokens/'+await digest(b.token),t=await read(key,null);if(!t||t.expires<Date.now())return json({error:'Odkaz vypršel nebo už byl použit. Vyžádejte si nový.'},400);
await env.BUCKET.delete(key);const token=random();await put('sessions/'+await digest(token),{email:t.email,expires:Date.now()+7*86400000});
const accountKey='accounts/'+await digest(t.email);if(!await read(accountKey,null))await put(accountKey,{email:t.email,created:new Date().toISOString()});
return json({ok:true},200,{'Set-Cookie':`__Host-doma=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`});}
if(u.pathname==='/api/auth/logout'&&req.method==='POST'){if(cookie)await env.BUCKET.delete('sessions/'+await digest(cookie));return json({ok:true},200,{'Set-Cookie':'__Host-doma=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'})}
const getOrders=async()=>{const list=await env.BUCKET.list({prefix:'order/',limit:1000});const rows=await Promise.all(list.objects.map(o=>read(o.key,null)));const legacy=await read('orders',[]);const merged=new Map(legacy.map(o=>[o.id,{...o,status:o.status||'Nová'}]));for(const o of rows.filter(Boolean))merged.set(o.id,o);return [...merged.values()].sort((a,b)=>b.date.localeCompare(a.date))};
if(u.pathname==='/api/account'){
if(!user)return json({error:'Nejprve se přihlaste.'},401);
return json({email:user.email,orders:(await getOrders()).filter(o=>o.accountEmail===user.email)});}
if(u.pathname.startsWith('/api/admin')){
if(!admin)return json({error:'Přístup pouze pro správce obchodu.'},403);
if(req.method==='GET'){const s=await getSettings();return json({settings:{email:s.email||'',from:s.from||'',emailReady:!!s.key},content,orders:await getOrders()});}
const b=await req.json();
if(u.pathname.endsWith('/products')){if(!Array.isArray(b)||b.length>200)return json({error:'Neplatná data.'},400);const ids=new Set();for(const p of b){if(typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||!Number.isFinite(p.price)||p.price<0||p.price>10000000)return json({error:'Zkontrolujte název a cenu.'},400);ids.add(p.id)}await put('products',b);return json({ok:true})}
if(u.pathname.endsWith('/content')){
let next={};for(const [key,def] of Object.entries(defaults)){if(b[key]===undefined){next[key]=content[key];continue}if(typeof def==='boolean')next[key]=!!b[key];else if(typeof def==='number'){if(!Number.isFinite(b[key])||b[key]<0||b[key]>100000)return json({error:'Neplatná cena dopravy.'},400);next[key]=b[key]}else next[key]=String(b[key]).slice(0,key==='terms'||key==='privacy'?40000:4000)}
for(const key of ['accentColor','backgroundColor'])if(!/^#[a-f0-9]{6}$/i.test(next[key]))return json({error:'Neplatná barva.'},400);
await put('content',next);return json({ok:true});}
if(u.pathname.endsWith('/settings')){if(!validEmail(b.email)||!validEmail(b.from))return json({error:'Vyplňte platné e-mailové adresy.'},400);const old=await read('settings',{});await put('settings',{email:b.email,from:b.from,key:b.key||old.key});return json({ok:true})}
if(u.pathname.endsWith('/order-status')){if(!/^[a-f0-9-]{36}$/.test(b.id)||!['Nová','Potvrzená','Odeslaná','Dokončená','Zrušená'].includes(b.status))return json({error:'Neplatný stav objednávky.'},400);const o=await read('order/'+b.id,null)||(await read('orders',[])).find(o=>o.id===b.id);if(!o)return json({error:'Objednávka nenalezena.'},404);await put('order/'+b.id,{...o,status:b.status});return json({ok:true})}
}
if(u.pathname==='/api/order'&&req.method==='POST'){
const b=await req.json();if(!b.name||!b.contact||!b.address||!Array.isArray(b.items)||!b.items.length||b.items.length>100)return json({error:'Vyplňte jméno, kontakt a doručovací adresu.'},400);
if(!/^[a-f0-9-]{36}$/.test(b.requestId||''))return json({error:'Obnovte prosím košík a zkuste to znovu.'},400);
const settings=await getSettings();if(env.TEST_MODE!=='true'&&(!settings.key||!settings.email||!settings.from))return json({error:'Obchod zatím nepřijímá objednávky. Správce musí nastavit odesílání e-mailů.'},503);
const old=await read('order/'+b.requestId,null);if(old&&old.status!=='Odesílání')return json({ok:true,id:old.id});
const products=await read('products',seed);let items=[];for(const i of b.items){const p=products.find(p=>p.id===i.id);if(!p||!Number.isInteger(i.qty)||i.qty<1||i.qty>999)return json({error:'Neplatná položka košíku.'},400);if(i.variant&&!(p.variant||'').split(',').map(v=>v.trim()).includes(i.variant))return json({error:'Neplatná varianta.'},400);items.push({name:p.name,price:p.price,qty:i.qty,variant:i.variant||''})}
const id=b.requestId,subtotal=items.reduce((s,i)=>s+Math.round(i.price*100)*i.qty,0)/100;
const order=old||{id,date:new Date().toISOString(),name:String(b.name).slice(0,200),contact:String(b.contact).slice(0,200),address:String(b.address).slice(0,500),note:String(b.note||'').slice(0,1000),items,subtotal,shipping:content.shippingPrice,codFee:content.codFee,total:Math.round((subtotal+content.shippingPrice+content.codFee)*100)/100,payment:'Dobírka',status:'Odesílání',accountEmail:user?.email||null};
// Store before sending so a delivered order is never lost on a later storage failure.
await put('order/'+id,order);
if(env.TEST_MODE==='true'){await put('order/'+id,{...order,status:'Nová',test:true});return json({ok:true,id,test:true})}
const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+settings.key,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:settings.from,to:[settings.email],...formatOrderEmail(order,content.brand)})});if(!response.ok)return json({error:'E-mail se nepodařilo odeslat. Košík zůstává uložený. Zkuste to prosím později.'},502);
await put('order/'+id,{...order,status:'Nová'});return json({ok:true,id});
}return json({error:'Nenalezeno'},404);
}catch(e){return json({error:'Požadavek se nepodařilo dokončit. Zkuste to znovu.'},500)}}};
