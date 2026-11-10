import { addDays, delta, niceDate, utc, safeLink } from './plan.js'
import { esc, icon, button } from './html.js'
import { bookingPrice } from './booking.js'
import { activitiesByTime } from './activity-order.js'
import { calendarSummary, stayTransitions } from './calendar-summary.js'
function bookingDetails(record) {
  if ((record.price==='' || record.price===undefined) && !record.currency && !record.booked && !record.paid) return ''
  return `<span class="booking-meta"><span class="booking-price">${esc(bookingPrice(record))}</span><span class="booking-state ${record.booked?'confirmed':''}">${record.booked?'Booked':'Booking not marked'}</span><span class="booking-state ${record.paid?'confirmed':''}">${record.paid?'Paid':'Payment not marked'}</span></span>`
}
const shortDate = date => esc(niceDate(date, { day:'numeric', month:'short' }))
function transitionDetails(state,date) {
  const transitions=stayTransitions(state.plan,date)
  return transitions.length?`<div class="stay-transitions">${transitions.map(item=>button('edit-stay',`<span>${esc(item.label)}</span><strong>${esc(item.time || 'Set time')}</strong>`,null,'stay-transition',`data-id="${esc(item.stay.id)}" aria-label="Edit timing for ${esc(item.label)}"`)).join('')}</div>`:''
}
const dot = color => `<span class="dot" style="background:${color}"></span>`
export function calendar(state) {
  const { plan } = state
  const months = [...new Set(state.dates.map(date => date.slice(0,7)))]
  return `<div class="months">${months.map(month => {
    const first = month + '-01', offset = (utc(first).getUTCDay() + 6) % 7
    const last = new Date(Date.UTC(+month.slice(0,4),+month.slice(5,7),0)).getUTCDate()
    const lastDate = addDays(first,last-1)
    const visibleStart = plan.startDate > first ? plan.startDate : first
    const visibleEnd = plan.endDate < lastDate ? plan.endDate : lastDate
    const startCell = Math.floor((offset + delta(first,visibleStart))/7)*7
    const endCell = Math.ceil((offset + delta(first,visibleEnd)+1)/7)*7
    return `<section class="month-block"><div class="month-title">${esc(niceDate(first,{month:'long',year:'numeric'}))}</div><div class="calendar">
      ${['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => `<div class="weekday">${day}</div>`).join('')}
      ${Array.from({length:endCell-startCell},(_,i) => {
        const date=addDays(first,startCell+i-offset)
        const inside=date.slice(0,7)===month && date>=plan.startDate && date<=plan.endDate
        const activities=plan.days[date]?.activities || []
        const {destinations,preview,remaining}=inside?calendarSummary(plan,date):{destinations:[],preview:[],remaining:0}
        const tag=inside?'button':'div'
        return `<${tag} class="cal-cell ${inside?'':'outside'} ${state.drawerDate===date?'selected-day':''}" ${inside?`data-action="open-day" data-date="${date}" aria-label="${esc(niceDate(date,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}"`:''}>
          <span class="date-num">${utc(date).getUTCDate()}${inside && activities.length?`<em>${activities.length}</em>`:''}</span>
          ${destinations.map(place=>`<span class="city-pill" title="${esc(place.name)}${place.checkout?' · Check-out day':''}" style="background:${place.color}20;color:${place.color}">${place.checkout?'↗':'●'} ${esc(place.name)}${place.timeLabel?`<span class="city-time">${esc(place.timeLabel)}</span>`:''}</span>`).join('')}
          ${preview.map(a => `<span class="cal-activity">${esc(a.time)} ${esc(a.title)}</span>`).join('')}
          ${remaining?`<span class="cal-more">+${remaining} more</span>`:''}
        </${tag}>`
      }).join('')}
    </div></section>`
  }).join('')}</div>`
}
export function timeline(state) {
  return `<div class="timeline-list">${state.dates.map(date => {
    const day=state.plan.days[date], stay=state.stayOn(date)
    return `<section class="timeline-day" data-date-drop="${date}">
      <div class="timeline-date"><div class="wday">${esc(niceDate(date,{weekday:'short'}))}</div><div class="big">${utc(date).getUTCDate()}</div><div class="mon">${esc(niceDate(date,{month:'short',year:'numeric'}))}</div></div>
      <div><div class="day-row-title"><div class="city-name">${dot(stay?.color || '#cbd4de')}${esc(stay?.name || 'Unassigned day')}</div>${button('open-day','Edit day','edit','btn tiny ghost',`data-date="${date}" aria-label="Edit day ${date}"`)}</div>
      ${transitionDetails(state,date)}${day?.overview?`<p class="day-summary">${esc(day.overview)}</p>`:''}
      <div class="activity-line">${activitiesByTime(day?.activities).map(activity => `<div class="activity-card" data-activity-id="${esc(activity.id)}">
        <button class="drag-handle" data-drag="${esc(activity.id)}" data-date="${date}" aria-label="Drag ${esc(activity.title)}" title="Drag to move to another day; edit the time to change its order">${icon('grip')}</button>
        <button class="activity-open" data-action="edit-activity" data-id="${esc(activity.id)}" data-date="${date}"><span class="activity-main"><span class="a-title ${activity.done?'completed':''}">${esc(activity.title)}</span>${activity.time?`<span class="a-time">${esc(activity.time)}</span>`:''}</span>${bookingDetails(activity)}</button>
      </div>`).join('')}${button('add-activity','Add activity','plus','dashed-add',`data-date="${date}" aria-label="Add activity ${date}"`)}</div></div>
    </section>`
  }).join('')}<p class="tiny-help">Activities are shown by time, with untimed ideas last. Drag a handle to move an activity to another day, or edit its date and time.</p></div>`
}
export function destinations(state) {
  return `<div class="two-column"><section class="workspace"><div class="workspace-head"><h2>Destinations & stays</h2>${button('add-stay','Add city','plus','btn primary')}</div>
  ${state.stays.length?`<div class="stay-list">${state.stays.map(stay => `<article class="stay-card"><div class="stay-color" style="background:${stay.color}"></div><div class="stay-body">
    <div class="stay-title"><span>${esc(stay.name)}</span>${button('edit-stay','','edit','icon-btn',`data-id="${esc(stay.id)}" aria-label="Edit ${esc(stay.name)}"`)}</div>
    <div class="stay-meta">${shortDate(stay.from)}${stay.checkInTime?` at ${esc(stay.checkInTime)}`:''} → ${shortDate(stay.to)}${stay.checkOutTime?` at ${esc(stay.checkOutTime)}`:''} · ${delta(stay.from,stay.to)} nights</div>
    <div class="stay-details">${stay.hotel?`<strong>${esc(stay.hotel)}</strong>`:'<span>Hotel not decided yet</span>'}<br>${esc(stay.area)}${stay.notes?`<p class="preserve-lines">${esc(stay.notes)}</p>`:''}</div>
    ${bookingDetails(stay)}
    ${stay.ideas?`<div class="ideas">${stay.ideas.split(/\n|,/).map(s=>s.trim()).filter(Boolean).map(idea=>`<span class="idea">${esc(idea)}</span>`).join('')}</div>`:''}
    <div class="stay-actions">${button('edit-stay','Edit stay',null,'btn tiny',`data-id="${esc(stay.id)}"`)}${button('open-day','View days',null,'btn tiny ghost',`data-date="${stay.from}" ${stay.from<state.plan.startDate || stay.from>state.plan.endDate?'disabled':''}`)}</div>
  </div></article>`).join('')}</div>`:`<div class="empty-board"><div class="illustration">${icon('map')}</div><h3>Start with your first city</h3><p>Add your dates, accommodation and a few places you want to explore.</p>${button('add-stay','Add destination','plus','btn primary')}</div>`}
  </section><aside class="side-panel"><h3>A place for every stop</h3><p>Check-in and check-out dates label your calendar automatically. Keep hotel details and ideas here until you’re ready to plan each day.</p><p>Check-out is the date you leave; 12–15 November is three nights. Add arrival and departure times to plan morning or evening travel.</p></aside></div>`
}
export function overview(state) {
  return `<div class="overview-wrap"><section class="overview-card"><div class="eyebrow">THE BIG PICTURE</div><h3>Your trip at a glance</h3><p class="helper">The route, the decisions, and the things you don’t want to forget.</p>
    ${state.stays.length?`<div class="overview-flow">${state.stays.map(stay=>`<div class="route-stop">${dot(stay.color)}<b>${esc(stay.name)}</b><small>${shortDate(stay.from)} · ${delta(stay.from,stay.to)} nights</small></div>`).join('')}</div>`:''}
    <div class="field"><label for="trip-overview">Trip overview</label><textarea id="trip-overview" data-save="overview" placeholder="Route, budget, priorities, favourite ideas…">${esc(state.plan.overview)}</textarea></div>
    <div class="field"><label for="trip-checklist">Packing, bookings & reminders</label><textarea id="trip-checklist" data-save="checklist" rows="7" placeholder="Passports, tickets, hotels, things to pack…">${esc(state.plan.checklist)}</textarea></div>
    <p class="tiny-help">Saved automatically in this browser. Download JSON backups to keep a copy.</p></section>
    <aside class="side-panel"><h3>Take your plan anywhere</h3><p>Send a JSON file to your friend, then import their updated file when they send it back. Each file is a snapshot; changes don’t sync automatically.</p>
    <div class="file-actions">${button('export','Download JSON backup','download')}${button('import','Import JSON','upload')}${button('pdf','Export PDF','note')}${button('new-trip','Start a fresh trip','plus','btn ghost')}</div><h3>Trip calendar</h3><p>Import the .ics file into a new calendar just for this trip. After editing your plan, delete that trip calendar, create a fresh one and import the latest file. This removes old events in one go.</p>${button('ics','Export full calendar .ics','calendar')}</aside></div>`
}
export function dayDetails(state) {
  const date=state.drawerDate, day=state.getDay(date)
  return `<div class="drawer-top"><span class="eyebrow">DAY DETAILS</span>${button('close-day','','x','icon-btn','aria-label="Close day details"')}</div>
    <h2 id="day-title" class="drawer-date">${esc(niceDate(date,{weekday:'long',day:'numeric',month:'long'}))}</h2>
    <div class="drawer-city">${esc(calendarSummary(state.plan,date).destinations.map(place=>place.name).join(' → ') || 'No destination assigned')} · ${niceDate(date,{year:'numeric'})}</div>
    ${transitionDetails(state,date)}<div class="field"><label for="day-overview">Day overview</label><textarea id="day-overview" data-dayfield="overview" placeholder="Arrive, settle in, explore the old town…">${esc(day.overview)}</textarea></div>
    <div class="drawer-section"><h4>Activities & stops</h4>${activitiesByTime(day.activities).map(activity=>`<div class="drawer-act"><div><strong class="${activity.done?'completed':''}">${esc(activity.title)}</strong><small>${esc(activity.time)} ${esc(activity.location || activity.category)}</small>${bookingDetails(activity)}${safeLink(activity.url)?`<small><a href="${esc(safeLink(activity.url))}" target="_blank" rel="noopener noreferrer">View saved link</a></small>`:''}</div>${button('edit-activity','','edit','icon-btn',`data-date="${date}" data-id="${esc(activity.id)}" aria-label="Edit ${esc(activity.title)}"`)}</div>`).join('')}
    ${day.activities.length?'':'<p class="muted">Nothing scheduled yet. Leave room to explore.</p>'}${button('add-activity','Add activity','plus','btn primary full-width',`data-date="${date}"`)}</div>
    <div class="drawer-section"><div class="field"><label for="day-notes">Extra notes</label><textarea id="day-notes" data-dayfield="notes" placeholder="Tickets, food spots, transport, backup plans…">${esc(day.notes)}</textarea></div><p class="tiny-help">Saved automatically in this browser.</p></div>`
}
export function workspace(state) {
  if (state.view==='stays') return destinations(state)
  if (state.view==='overview') return overview(state)
  return `<section class="workspace"><div class="workspace-head"><div class="head-left"><h2>${state.view==='calendar'?'Your calendar':'Day by day'}</h2><small>${state.dates.length} days</small></div>
  <div class="tab-switch" aria-label="Itinerary view">${button('view','Calendar','calendar',state.view==='calendar'?'selected':'',`data-view="calendar" aria-pressed="${state.view==='calendar'}"`)}${button('view','List','list',state.view==='timeline'?'selected':'',`data-view="timeline" aria-pressed="${state.view==='timeline'}"`)}</div></div>
  ${!state.stays.length && !state.activityCount?`<div class="getting-started"><span>Where are you heading? Add a destination, or tap a day to start planning.</span>${button('add-stay','Add destination','plus')}</div>`:''}
  ${state.view==='calendar'?calendar(state):timeline(state)}</section>`
}
export function shell(state) {
  const {plan}=state
  const navigation=[['calendar','calendar','Calendar'],['timeline','list','Daily itinerary'],['stays','bed','Destinations & stays'],['overview','note','Trip notes']]
  const stats=[[state.dates.length,'Travel days','calendar'],[state.stays.length,'Stays & cities','map'],[state.stays.reduce((n,s)=>n+delta(s.from,s.to),0),'Nights planned','bed'],[state.activityCount,'Activities','sun']]
  return `<div class="shell"><nav class="sidebar" aria-label="Trip navigation"><div class="brand"><div class="brand-mark">${icon('compass')}</div>roam<span class="brand-dot">.</span></div><div class="side-label">YOUR WORKSPACE</div>
  ${navigation.map(([key,i,title])=>button('view',title,i,`side-link ${state.view===key?'active':''}`,`data-view="${key}" ${state.view===key?'aria-current="page"':''}`)).join('')}
  <div class="side-bottom"><div class="side-label">MY DESTINATIONS</div><div class="side-destinations" role="region" aria-label="Destinations" tabindex="0">${state.stays.map(stay=>button('edit-stay',dot(stay.color)+`<span class="truncate">${esc(stay.name)}</span>`,null,'side-link',`data-id="${esc(stay.id)}" title="${esc(stay.name)}"`)).join('')}${state.stays.length?'':'<p class="muted side-empty">No cities added yet</p>'}</div><div class="side-note"><strong>Just you and your plans</strong><br>Saved in this browser. Share a JSON file to bring your friend along.</div></div></nav>
  <main id="main" class="main"><header class="topbar"><div class="crumb">My trips ${icon('chevron')}<strong>${esc(plan.name)}</strong></div><div class="top-actions">${button('import','Import JSON','upload','btn desktop-only')}${button('export','Export','download','btn desktop-only')}${button('pdf','Export PDF','note','btn desktop-only')}${button('share','<span>Share plan</span>','share','btn primary','aria-label="Share plan"')}${button('settings','','settings','btn mobile-only','aria-label="Trip settings"')}</div></header>
  <div class="content"><div id="storage-status"></div><div class="hero"><div><div class="eyebrow">YOUR JOURNEY, YOUR WAY</div><h1>${esc(plan.name)}</h1><p>${shortDate(plan.startDate)} – ${esc(niceDate(plan.endDate,{day:'numeric',month:'short',year:'numeric'}))} <span class="separator">·</span> ${esc(plan.subtitle)}</p></div>${button('settings','Trip settings','settings','pill')}</div>
  <div class="stats">${stats.map(([value,label,i])=>`<div class="stat"><div><div class="num">${value}</div><div class="label">${label}</div></div><div class="stat-icon">${icon(i)}</div></div>`).join('')}</div>
  ${workspace(state)}<div class="footer-info" id="backup-status"></div></div></main></div>`
}
