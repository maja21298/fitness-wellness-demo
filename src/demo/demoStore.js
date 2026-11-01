// Entirely browser-local imitation of only the Firestore calls used by the demo.
// NO FIREBASE NETWORK REQUESTS, credentials, or access to real user data.
const KEY = 'maja_fitness_demo_2026_en_v2';
export const DEMO_UID = 'demo-user-2026';
const dateKey = (d) => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function dayOffset(i){const d=new Date();d.setDate(d.getDate()+i);return dateKey(d)}
function defaults(){
  const seeded={};
  [-13,-11,-9,-6,-4,-2].forEach((offset,i)=>{
    seeded[`progress/${DEMO_UID}/daily/${dayOffset(offset)}`]={
      date:dayOffset(offset), workoutCompleted:true,
      caloriesConsumed: i%2 ? 1760: 1540,
      plannedNutritionCalories: i%2 ? 1710: 1850,
      ...(i%3===0 ? {weight:65.4-i*.1}:{}),
    };
  });
  seeded[`progress/${DEMO_UID}/daily/${dayOffset(0)}`]={
     date:dayOffset(0), caloriesConsumed:620, plannedNutritionCalories:1750,
     workoutCompleted:false, weight:64.8
  };
  seeded[`plans/${DEMO_UID}`]={workout:{location:'home'}};
  return seeded;
}
function read(){try{const item=JSON.parse(localStorage.getItem(KEY));return item && typeof item==='object' ? item:defaults()}catch{return defaults()}}
function store(data){try{localStorage.setItem(KEY,JSON.stringify(data))}catch{/* private browsing */}}
function plain(value){
  if(value instanceof Date) return value.toISOString();
  if(value===null||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(plain);
  const result={};for(const [k,v] of Object.entries(value))result[k]=plain(v);return result;
}
function deepMerge(a,b){
  if(!a||typeof a!=='object'||Array.isArray(a))return plain(b);
  const dest={...a};for(const [k,v] of Object.entries(b)){
    if(v&&v.__demoDelete){delete dest[k];continue;}
    if(v&&v.__demoUnion){dest[k]=[...new Set([...(Array.isArray(dest[k])?dest[k]:[]),...v.__demoUnion])];continue;}
    dest[k]=(v&&typeof v==='object'&&!Array.isArray(v)&&!(v instanceof Date)) ? deepMerge(dest[k],v):plain(v);
  }return dest;
}
function docRef(parts){return {path:parts.join('/'),id:parts[parts.length-1]}}
export const doc = (_db,...parts)=>docRef(parts);
export const collection=(_db,...parts)=>({path:parts.join('/'),id:parts.at(-1)});
export const documentId=()=> '__name__';
export const where=(field,op,value)=>({type:'where',field,op,value});
export const orderBy=(field,direction='asc')=>({type:'orderBy',field,direction});
export const limit=(count)=>({type:'limit',count});
export const query=(base,...clauses)=>({...base,clauses});
function snap(ref,data){return {id:ref.id,ref,exists:()=>data!==undefined,data:()=>data===undefined?undefined:structuredClone(data)}}
export async function getDoc(ref){return snap(ref,read()[ref.path])}
export async function setDoc(ref,data,options={}){
  const all=read();all[ref.path]=options.merge?deepMerge(all[ref.path]||{},data):plain(data);store(all);
}
export async function updateDoc(ref,data){return setDoc(ref,data,{merge:true})}
export async function deleteDoc(ref){const all=read();delete all[ref.path];store(all)}
export async function addDoc(col,data){const ref=docRef([...col.path.split('/'),`sample-${Date.now()}`]);await setDoc(ref,data);return ref}
export async function getDocs(ref){
  let docs=Object.entries(read()).filter(([key])=>key.startsWith(ref.path+'/')&&key.slice(ref.path.length+1).indexOf('/')<0)
    .map(([key,value])=>snap(docRef(key.split('/')),value));
  for(const clause of (ref.clauses||[])){
    if(clause.type==='where')docs=docs.filter(d=>{
      const got=clause.field==='__name__'?d.id:d.data()?.[clause.field];
      if(clause.op==='==')return got===clause.value;
      if(clause.op==='>=')return got>=clause.value;
      if(clause.op==='<=')return got<=clause.value;
      if(clause.op==='>')return got>clause.value;
      if(clause.op==='<')return got<clause.value;
      return true;
    });
    if(clause.type==='orderBy')docs.sort((a,b)=>String(a.data()?.[clause.field]??a.id).localeCompare(String(b.data()?.[clause.field]??b.id))*(clause.direction==='desc'?-1:1));
    if(clause.type==='limit')docs=docs.slice(0,clause.count);
  }
  return {docs,empty:docs.length===0,size:docs.length,forEach:fn=>docs.forEach(fn)};
}
export const serverTimestamp=()=>new Date().toISOString();
export const arrayUnion=(...items)=>({__demoUnion:items});
export const deleteField=()=>({__demoDelete:true});
export const increment=(amount)=>amount;
export const Timestamp={now:()=>({toDate:()=>new Date()})};
export async function runTransaction(_db,fn){
  const tx={get:getDoc,set:(...args)=>setDoc(...args),update:(...args)=>updateDoc(...args)};
  return await fn(tx);
}
export function resetDemoStore(){try{localStorage.removeItem(KEY)}catch{/* ignore */}}
