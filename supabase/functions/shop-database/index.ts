// This hash is public verification material, never the database bridge credential.
const EXPECTED_TOKEN_HASH = '132b7ae2b810303f93c4f7adcb109c9f8fd071817a636109eb455378c6d7597b';
const hash=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req:Request)=>{
try{
if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
const token=req.headers.get('x-shop-database-token')||'';
if(token.length!==64||await hash(token)!==EXPECTED_TOKEN_HASH)return Response.json({error:'Unauthorized'},{status:401});
const body=await req.json();const key=body.key;
if(typeof key!=='string'||key.length>500)return Response.json({error:'Invalid key'},{status:400});
const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');const secret=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if(!secret)throw Error('Database credentials unavailable');
const url=new URL(Deno.env.get('SUPABASE_URL')+'/rest/v1/shop_records');
const headers:Record<string,string>={apikey:secret,'Content-Type':'application/json'};if(!secret.startsWith('sb_secret_'))headers.Authorization='Bearer '+secret;
let method='GET',payload:unknown;
if(body.op==='list'){url.searchParams.set('key','like.'+key.replace(/[\\%_]/g,'\\$&')+'%');url.searchParams.set('select','key');url.searchParams.set('limit','1000');url.searchParams.set('order','key.asc')}
else if(body.op==='get'){url.searchParams.set('key','eq.'+key);url.searchParams.set('select','value');url.searchParams.set('limit','1')}
else if(body.op==='put'||body.op==='claim'){method='POST';headers.Prefer=body.op==='put'?'resolution=merge-duplicates,return=minimal':'return=minimal';payload={key,value:body.value,updated_at:new Date().toISOString()}}
else if(body.op==='delete'){method='DELETE';url.searchParams.set('key','eq.'+key)}
else return Response.json({error:'Invalid operation'},{status:400});
const response=await fetch(url,{method,headers,...(payload?{body:JSON.stringify(payload)}:{})});
if(body.op==='claim'&&response.status===409)return Response.json({claimed:false});
if(!response.ok){console.error('Database operation failed',body.op,response.status);return Response.json({error:'Database unavailable'},{status:502})}
if(body.op==='get'){const rows=await response.json();return Response.json({found:rows.length>0,value:rows[0]?.value})}
if(body.op==='list'){const rows=await response.json();return Response.json({objects:rows})}
return Response.json({ok:true,...(body.op==='claim'?{claimed:true}:{})});
}catch{ return Response.json({error:'Database operation failed'},{status:500})}
});
