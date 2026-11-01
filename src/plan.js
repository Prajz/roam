const COLORS = ['#ec7658','#7c9fe7','#62b59b','#ae8ada','#e3ae56','#5b9dbb','#d779a1','#8d9c76'];
const ICONS = {
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16.2 7.8-2.7 5.7-5.7 2.7 2.7-5.7z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  bed:'<path d="M3 18v-9M21 18V9M3 15h18M3 10h6a3 3 0 0 1 3 3v2M12 15v-3h6a3 3 0 0 1 3 3M3 19v2M21 19v2"/>',
  note:'<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8zM15 3v6h6M7 13h10M7 17h7"/>',
  upload:'<path d="M12 16V3m0 0-5 5m5-5 5 5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  download:'<path d="M12 3v13m0 0-5-5m5 5 5-5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  share:'<path d="M12 16V3m0 0-5 5m5-5 5 5M5 13v7h14v-7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="m15 5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z"/>',
  settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M19.4 15a2 2 0 0 0 .4 2.2l.2.2-2.5 2.5-.2-.2a2 2 0 0 0-2.2-.4l-.3.1V22h-3.6v-.3a2 2 0 0 0-1.4-1.9 2 2 0 0 0-2.2.4l-.2.2-2.5-2.5.2-.2a2 2 0 0 0 .4-2.2l-.1-.3H3v-3.6h.3a2 2 0 0 0 1.9-1.4 2 2 0 0 0-.4-2.2l-.2-.2L7.1 5l.2.2a2 2 0 0 0 2.2.4l.3-.1V3h3.6v.3a2 2 0 0 0 1.4 1.9 2 2 0 0 0 2.2-.4l.2-.2 2.5 2.5-.2.2a2 2 0 0 0-.4 2.2l.1.3H22v3.6h-.3a2 2 0 0 0-1.9 1.4Z" transform="translate(-.5 -.5) scale(1.02)"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  grip:'<circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 3"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
  suitcase:'<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M9 7V4h6v3M8 7v14M16 7v14"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
};
function uid(){return globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);}
function utc(s){return new Date(`${s}T12:00:00Z`)}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(s,n){const d=utc(s); d.setUTCDate(d.getUTCDate()+n);return iso(d)}
function delta(a,b){return Math.round((utc(b)-utc(a))/86400000)}
function validDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&iso(utc(s))===s}
function niceDate(s,opt={}){return utc(s).toLocaleDateString('en-GB',{timeZone:'UTC',...opt})}
function dayList(plan){const days=[];for(let d=plan.startDate,i=0;d<=plan.endDate&&i<370;d=addDays(d,1),i++)days.push(d);return days}
function blankPlan(){const today=iso(new Date());return {schemaVersion:1,name:'My next adventure',subtitle:'A little more exploring, a lot more memories.',startDate:today,endDate:addDays(today,6),overview:'',checklist:'',stays:[],days:{}};}
function normalise(raw){if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schemaVersion!==1||!validDate(raw.startDate)||!validDate(raw.endDate)||raw.startDate>raw.endDate||delta(raw.startDate,raw.endDate)>366)throw new Error('Not a supported Roam trip JSON file (version 1, up to 1 year).');let p={...blankPlan(),name:String(raw.name||'My trip').slice(0,140),subtitle:String(raw.subtitle||'').slice(0,300),startDate:raw.startDate,endDate:raw.endDate,overview:String(raw.overview||''),checklist:String(raw.checklist||'')};p.stays=(Array.isArray(raw.stays)?raw.stays:[]).slice(0,300).filter(s=>s&&validDate(s.from)&&validDate(s.to)&&s.from<s.to).map(s=>({id:String(s.id||uid()),name:String(s.name||'New destination'),from:s.from,to:s.to,color:COLOR_SET.has(s.color)?s.color:COLORS[0],hotel:String(s.hotel||''),area:String(s.area||''),notes:String(s.notes||''),ideas:String(s.ideas||'')}));p.days={};if(raw.days&&typeof raw.days==='object'&&!Array.isArray(raw.days)){for(const [date,d] of Object.entries(raw.days)){if(!validDate(date)||date<p.startDate||date>p.endDate||!d||typeof d!=='object')continue;p.days[date]={overview:String(d.overview||''),notes:String(d.notes||''),activities:(Array.isArray(d.activities)?d.activities:[]).slice(0,500).filter(Boolean).map(a=>({id:String(a.id||uid()),title:String(a.title||'Untitled'),time:String(a.time||''),location:String(a.location||''),category:String(a.category||'activity'),notes:String(a.notes||''),url:String(a.url||''),done:Boolean(a.done)}))};}}return p;}
const COLOR_SET = new Set(COLORS);

function safeLink(u){ try{const p=new URL(u);return ['https:','http:'].includes(p.protocol)?p.href:null}catch{return null} }

export { COLORS, ICONS, uid, utc, iso, addDays, delta, validDate, niceDate, dayList, blankPlan, normalise, safeLink };
