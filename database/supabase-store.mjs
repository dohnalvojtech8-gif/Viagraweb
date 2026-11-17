export function createSupabaseStore({url,token,fetcher=fetch}){
 async function call(op,key,value){const response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json','x-shop-database-token':token},body:JSON.stringify({op,key,...(value!==undefined?{value}:{})}),signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Database unavailable');return response.json()}
 return {async get(key){const r=await call('get',key);return r.found?{json:async()=>r.value}:null},async put(key,value){await call('put',key,JSON.parse(value))},async delete(key){await call('delete',key)},async list({prefix}){return call('list',prefix)},async claim(key,value){return (await call('claim',key,value)).claimed}};
}
