import { dayList, delta, niceDate } from './plan.js'
import { activitiesByTime } from './activity-order.js'
import { calendarSummary, stayTransitions } from './calendar-summary.js'
import { esc } from './html.js'

// Export a deliberate itinerary-only projection. Notes may contain prices or booking secrets.
export function withoutPrices(value,currencies=[]) {
  const amount='[0-9]+(?:[,.][0-9]+)*(?:\\s*[-–]\\s*[0-9]+(?:[,.][0-9]+)*)?'
  const extra=currencies.filter(code=>typeof code==='string' && /^[A-Z]{3}$/.test(code)).join('|')
  const codes='(?:CNY|RMB|GBP|USD|EUR|JPY|HKD|INR|AUD|CAD|SGD|NZD|CHF|KRW|TWD|MYR|THB|AED|NOK|SEK|DKK'+(extra?'|'+extra:'')+')'
  const words='(?:yuan|renminbi|pounds?|dollars?|euros?|yen|rupees?)'
  const suffix='(?:\\s*(?:per\\s+(?:person|night|ticket)|/(?:person|night|ticket|pp)))?'
  return String(value || '')
    .replace(new RegExp('(?:[£€$¥￥₹₩]\\s*'+amount+'|\\b'+codes+'\\s*'+amount+'|'+amount+'\\s*(?:'+codes+'|'+words+')\\b)'+suffix,'gi'),'')
    .replace(new RegExp('(?:人民币|港币|英镑|美元|欧元|日元)\\s*'+amount+'|'+amount+'\\s*(?:元|人民币|港币|英镑|美元|欧元|日元)','g'),'')
    .replace(new RegExp('\\b(?:price|cost|deposit|total|paid)\\s*[:=]\\s*'+amount+suffix,'gi'),'')
    .replace(/\(\s*\)|\[\s*\]/g,'').replace(/[ \t]{2,}/g,' ').replace(/\s*[|·–-]\s*$/g,'').trim()
}
function stayLength(stay) {
  const nights=delta(stay.from,stay.to)
  if (!stay.checkInTime || !stay.checkOutTime) return `${nights} night${nights===1?'':'s'}`
  const minutes=time=>+time.slice(0,2)*60 + +time.slice(3)
  const duration=nights*1440+minutes(stay.checkOutTime)-minutes(stay.checkInTime)
  const days=Math.floor(duration/1440),hours=Math.floor(duration%1440/60),mins=duration%60
  const parts=[days?`${days} day${days===1?'':'s'}`:'',hours?`${hours} hour${hours===1?'':'s'}`:'',mins?`${mins} min`:''].filter(Boolean)
  return `${nights} night${nights===1?'':'s'} · ${parts.join(', ')} planned stay`
}
export function pdfOverview(plan,contacts=[]) {
  const currencies=[...plan.stays,...Object.values(plan.days).flatMap(day=>day.activities)].map(record=>record.currency)
  const clean=value=>withoutPrices(value,currencies)
  const stays=[...plan.stays].sort((a,b)=>a.from.localeCompare(b.from)).map(stay=>({
    name:clean(stay.name) || 'Destination',from:stay.from,to:stay.to,
    checkInTime:stay.checkInTime || '',checkOutTime:stay.checkOutTime || '',
    hotel:clean(stay.hotel),area:clean(stay.area),length:stayLength(stay),
  }))
  const days=[]
  for (const date of dayList(plan)) {
    const places=calendarSummary(plan,date).destinations.map(place=>clean(place.name)).filter(Boolean)
    const transitions=stayTransitions(plan,date).map(item=>({label:clean(item.label),time:item.time}))
    const activities=activitiesByTime(plan.days[date]?.activities).map(activity=>({
      title:clean(activity.title) || 'Activity',time:activity.time || '',location:clean(activity.location),
    }))
    const previous=days.at(-1)
    if (previous && !activities.length && !transitions.length && !previous.activities.length && !previous.transitions.length && places.join('\n')===previous.places.join('\n')) previous.to=date
    else days.push({from:date,to:date,places,transitions,activities})
  }
  return {
    name:clean(plan.name) || 'Our trip',startDate:plan.startDate,endDate:plan.endDate,
    totalDays:dayList(plan).length,activityCount:Object.values(plan.days).reduce((n,day)=>n+day.activities.length,0),
    stays,days,contacts:contacts.filter(c=>c.name?.trim()).map(c=>({name:c.name.trim(),email:String(c.email || '').trim(),phone:String(c.phone || '').trim()})),
  }
}
const dateLabel=date=>niceDate(date,{day:'numeric',month:'short',year:'numeric'})
const range=(from,to)=>from===to?dateLabel(from):`${dateLabel(from)} - ${dateLabel(to)}`
// Use a separate CJK font run: some browser PDF engines omit sans-serif fallback glyphs.
const reportText=value=>esc(value).replace(/([\u2e80-\u9fff\uf900-\ufaff]+)/g,'<span class="cjk">$1</span>')
const clock=time=>time?esc(time):'Flexible'
export function pdfHTML(plan,contacts=[]) {
  const report=pdfOverview(plan,contacts)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${esc(report.name)} - trip overview</title><style>
    @page{size:A4;margin:17mm 16mm 18mm;@bottom-left{content:"roam.  /  Trip overview";font:8pt Arial,sans-serif;color:#718092}@bottom-right{content:counter(page) " / " counter(pages);font:8pt Arial,sans-serif;color:#718092}}
    .cjk{font-family:serif}*{box-sizing:border-box}html{background:#fff}body{font-family:Arial,sans-serif;color:#243246;margin:0;font-size:10pt;line-height:1.5;overflow-wrap:anywhere}h1,h2,h3,p{margin:0}header{border-bottom:2px solid #e77b61;padding-bottom:17pt;margin-bottom:20pt}.brand{font-size:21pt;font-weight:800;letter-spacing:-1.2pt;color:#243246}.brand span{color:#dc6a50}.eyebrow{font-size:8pt;letter-spacing:1.5pt;text-transform:uppercase;color:#976150;margin:18pt 0 6pt;font-weight:700}h1{font-size:29pt;line-height:1.12;letter-spacing:-1pt;max-width:36ch;margin-bottom:11pt}header .dates{color:#53667a;font-size:11pt}.summary{display:flex;gap:20pt;margin-top:13pt;font-size:9pt;color:#5d6c7c}.summary strong{font-size:13pt;color:#243246}.section-title{font-size:15pt;letter-spacing:-.3pt;margin:24pt 0 11pt;break-after:avoid}.contacts{padding:12pt 15pt;background:#f3f6f7;border-left:3pt solid #b0bebf;margin:0 0 20pt;break-inside:avoid}.contacts h2{font-size:10pt;margin-bottom:6pt}.contact{margin-top:5pt;font-size:9pt}.contact strong{margin-right:9pt}.contact span{color:#556879;margin-right:9pt}.route{border-collapse:collapse;width:100%;table-layout:fixed}.route th{text-align:left;font-size:8pt;letter-spacing:.6pt;text-transform:uppercase;color:#738293;padding:8pt 7pt;border-bottom:1pt solid #cad3db}.route td{padding:11pt 7pt;border-bottom:.6pt solid #e0e5e9;vertical-align:top;font-size:9pt}.route th:nth-child(1){width:30%}.route th:nth-child(2){width:35%}.route th:nth-child(3){width:35%}.route tr{break-inside:avoid}.route thead{display:table-header-group}.route strong{font-size:10pt}.route small{display:block;font-size:8pt;color:#617487;margin-top:4pt}.route .times{margin-top:5pt;color:#637080}.day{padding-top:13pt;border-top:.6pt solid #d8e0e6;margin-top:14pt}.day-heading{display:flex;gap:15pt;justify-content:space-between;align-items:baseline;margin-bottom:8pt;break-after:avoid}.day h3{font-size:11pt;line-height:1.4}.day .places{font-size:9pt;color:#976150;font-weight:700;text-align:right;max-width:47%}.transitions{break-after:avoid;font-size:8.5pt;color:#675d51;padding:6pt 9pt;background:#faf5ef;margin-bottom:8pt;break-inside:avoid}.transition+.transition{margin-top:3pt}.transition strong{margin-right:8pt}.activities{list-style:none;margin:0;padding:0}.activity{display:flex;gap:13pt;padding:7pt 0;break-inside:avoid}.activity+.activity{border-top:.5pt solid #edf0f2}.activity .time{width:43pt;flex-shrink:0;font-size:9pt;color:#6d7d8b;font-variant-numeric:tabular-nums}.activity .title{font-size:10pt;font-weight:600}.activity .location{font-size:8.5pt;color:#6b7c8c;margin-top:2pt}.flexible{font-size:9pt;color:#738293;margin:6pt 0 10pt}.hint{font-size:8pt;color:#778494;margin-top:9pt}.empty{font-size:9pt;color:#66788a;padding:10pt 0}footer{font-size:8pt;color:#7a8793;border-top:.6pt solid #dce2e7;margin-top:22pt;padding-top:10pt}
    @media print{html,body{background:white}.contacts,.transitions{-webkit-print-color-adjust:exact;print-color-adjust:exact}h1,h2,h3{break-after:avoid}p{orphans:3;widows:3}}
    @media screen{html{background:#e8edf1}body{max-width:210mm;min-height:297mm;margin:20px auto;padding:17mm 16mm;background:white;box-shadow:0 5px 25px #2432461a}}
    @media screen and (max-width:600px){body{padding:24px 18px;margin:0;min-height:100vh}h1{font-size:26px}.summary{gap:14px}.route td,.route th{padding:8px 4px;font-size:10px}.route strong{font-size:11px}.route small{font-size:10px}.day-heading{flex-direction:column;gap:4px}.day .places{text-align:left;max-width:100%}.contacts{padding:12px}.contact span{display:block}.activity{gap:10px}}
  </style></head><body>
    <header><div class="brand">roam<span>.</span></div><p class="eyebrow">The journey at a glance</p><h1>${reportText(report.name)}</h1><p class="dates">${esc(range(report.startDate,report.endDate))}</p><div class="summary"><span><strong>${report.totalDays}</strong> days</span><span><strong>${report.stays.length}</strong> stays</span><span><strong>${report.activityCount}</strong> activities</span></div></header>
    ${report.contacts.length?`<section class="contacts"><h2>Travel contacts</h2>${report.contacts.map(contact=>`<p class="contact"><strong>${reportText(contact.name)}</strong>${contact.email?`<span>${esc(contact.email)}</span>`:''}${contact.phone?`<span>${esc(contact.phone)}</span>`:''}</p>`).join('')}</section>`:''}
    <h2 class="section-title">Where we’re going</h2>${report.stays.length?`<table class="route"><thead><tr><th>Place</th><th>Dates & times</th><th>Time here</th></tr></thead><tbody>${report.stays.map(stay=>`<tr><td><strong>${reportText(stay.name)}</strong>${stay.hotel?`<small>${reportText(stay.hotel)}</small>`:''}${stay.area?`<small>${reportText(stay.area)}</small>`:''}</td><td>${esc(range(stay.from,stay.to))}<div class="times">Arrive ${stay.checkInTime?esc(stay.checkInTime):'time not set'}<br>Leave ${stay.checkOutTime?esc(stay.checkOutTime):'time not set'}</div></td><td>${esc(stay.length)}</td></tr>`).join('')}</tbody></table>`:'<p class="empty">Destinations have not been added yet.</p>'}
    <h2 class="section-title">Day by day</h2><p class="hint">All times are local to each destination. Untimed activities are flexible ideas.</p>
    ${report.days.map(day=>`<section class="day"><div class="day-heading"><h3>${esc(range(day.from,day.to))}</h3>${day.places.length?`<p class="places">${reportText(day.places.join(' / '))}</p>`:''}</div>${day.transitions.length?`<div class="transitions">${day.transitions.map(item=>`<p class="transition"><strong>${clock(item.time)}</strong>${reportText(item.label)}</p>`).join('')}</div>`:''}${day.activities.length?`<ul class="activities">${day.activities.map(activity=>`<li class="activity"><span class="time">${clock(activity.time)}</span><div><p class="title">${reportText(activity.title)}</p>${activity.location?`<p class="location">${reportText(activity.location)}</p>`:''}</div></li>`).join('')}</ul>`:'<p class="flexible">Open time to explore. No activities scheduled.</p>'}</section>`).join('')}
    <footer>Made with Roam. Times and plans may change; check your travel arrangements before leaving.</footer>
  </body></html>`
}
