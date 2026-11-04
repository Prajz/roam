import { blankPlan, normalise, dayList, uid, iso, addDays, delta, validDate, validTime, niceDate, COLORS } from './plan.js'
import { activitiesByTime } from './activity-order.js'
import { parsePlanJSON } from './plan-json.js'
const STORE_KEY = 'roam-personal-trip-v1'
const SETUP_KEY = 'roam-onboarding-complete-v1'
export function createPlanner(onChange = () => {}) {
  const state = { storageError: '', toastMessage: '', view: 'calendar', drawerDate: null, editor: null, editorError: '', needsBackup: false, hasSavedPlan: false, onboarding: true }
  let initial = blankPlan(), timer
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (saved) { initial = normalise(JSON.parse(saved)); state.hasSavedPlan = true }
    state.onboarding = !state.hasSavedPlan && !localStorage.getItem(SETUP_KEY)
  }
  catch { state.storageError = 'Your saved trip could not be read. Import a JSON backup to recover it. The saved copy has not been overwritten.' }
  const plan = initial
  state.plan = plan
  Object.defineProperties(state, {
    dates: { get: () => dayList(plan) },
    stays: { get: () => [...plan.stays].sort((a,b) => a.from.localeCompare(b.from)) },
    activityCount: { get: () => Object.values(plan.days).reduce((n,d) => n + d.activities.length, 0) },
  })
  function toast(message) {
    state.toastMessage = message
    clearTimeout(timer)
    onChange('status')
    timer = setTimeout(() => { state.toastMessage = ''; onChange('status') }, 4500)
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(plan)); state.storageError = ''; state.needsBackup = true; state.hasSavedPlan = true }
    catch { state.storageError = 'Changes could not be saved in this browser. Download a JSON backup before leaving.' }
    onChange('status')
  }
  function getDay(date) { return plan.days[date] ||= { overview: '', notes: '', activities: [] } }
  function stayOn(date) { return state.stays.filter(s => s.from <= date && date < s.to).at(-1) }
  function openDay(date) { if (date >= plan.startDate && date <= plan.endDate) { getDay(date); state.drawerDate = date } }
  function setView(next) { state.view = next; state.drawerDate = null }
  function openEditor(kind, record, date) {
    state.editorError = ''
    state.editor = { kind, date, record: record ? { ...structuredClone(record), ...(kind === 'activity' ? { date } : {}) } : undefined }
  }
  function saveEditor(draft) {
    const fail = message => state.editorError = message
    const kind = state.editor.kind
    if (kind === 'settings') {
      if (!validDate(draft.startDate) || !validDate(draft.endDate) || draft.startDate > draft.endDate || delta(draft.startDate, draft.endDate) > 366) return fail('Choose a valid date range of up to one year.')
      const outside = Object.entries(plan.days).some(([date, day]) => (date < draft.startDate || date > draft.endDate) && (day.overview || day.notes || day.activities.length)) || plan.stays.some(s => s.from < draft.startDate || s.to > addDays(draft.endDate, 1))
      if (outside) return fail('There are stays, activities or notes outside these dates. Move or remove them first so nothing is lost.')
      Object.assign(plan, { name: draft.name.trim() || 'My trip', subtitle: draft.subtitle, startDate: draft.startDate, endDate: draft.endDate })
    } else if (kind === 'stay') {
      if (!draft.name.trim() || !validDate(draft.from) || !validDate(draft.to) || draft.from >= draft.to || draft.from < plan.startDate || draft.to > addDays(plan.endDate, 1)) return fail('Choose a destination and stay dates within your trip. Check-out must follow check-in.')
      if (!validTime(draft.checkInTime ?? '') || !validTime(draft.checkOutTime ?? '')) return fail('Use local times in HH:MM (24-hour), or leave them blank.')
      const record = { ...draft, checkInTime:draft.checkInTime ?? '', checkOutTime:draft.checkOutTime ?? '', id: draft.id || uid(), name: draft.name.trim(), color: COLORS.includes(draft.color) ? draft.color : COLORS[0] }
      const index = plan.stays.findIndex(s => s.id === draft.id)
      if (index >= 0) plan.stays[index] = record
      else plan.stays.push(record)
    } else {
      if (!draft.title.trim() || !validDate(draft.date) || draft.date < plan.startDate || draft.date > plan.endDate) return fail('Enter an activity name and a date within your trip.')
      if (draft.url && !/^https?:\/\//i.test(draft.url)) return fail('Use a link starting with https:// or http://.')
      const { date, ...activity } = draft
      const record = { ...activity, id: draft.id || uid(), title: draft.title.trim() }
      const originalDate = state.editor.date
      const source = getDay(originalDate).activities
      const index = source.findIndex(a => a.id === draft.id)
      if (index >= 0 && originalDate === date) source[index] = record
      else { if (index >= 0) source.splice(index, 1); getDay(date).activities.push(record) }
      if (state.drawerDate) openDay(date)
    }
    state.editor = null
    save()
    toast('Changes saved')
  }
  function deleteRecord() {
    if (!confirm('Delete this ' + (state.editor.kind === 'stay' ? 'destination? Day notes and activities will stay.' : 'activity?'))) return
    const { kind, record, date } = state.editor
    if (kind === 'stay') plan.stays = plan.stays.filter(s => s.id !== record.id)
    else getDay(date).activities = getDay(date).activities.filter(a => a.id !== record.id)
    state.editor = null
    save()
    toast('Deleted')
  }
  function replacePlan(next) {
    Object.assign(plan, next)
    state.onboarding = false
    try { localStorage.setItem(SETUP_KEY, '1') } catch {}
    state.drawerDate = null; state.editor = null; state.view = 'calendar'
    save(); onChange('render')
  }
  function applyJSON(source) {
    const next=parsePlanJSON(source)
    Object.assign(plan,next)
    state.drawerDate=null;state.editor=null
    save();onChange('render');toast('JSON changes applied')
  }
  function newTrip() {
    if (!confirm('Set up a new trip? Your current plan stays until you finish. Export a backup first if you want to keep it.')) return
    state.onboarding = true; state.drawerDate = null; state.editor = null
    onChange('setup')
  }
  function finishSetup(next) { replacePlan(next); toast('Your starter trip is ready. Adjust the dates and ideas to make it yours.') }
  function dismissSetup() {
    state.onboarding = false
    try { localStorage.setItem(SETUP_KEY, '1') } catch {}
    onChange('render')
  }
  function importJSON(source) {
    const next=parsePlanJSON(source)
    if (state.hasSavedPlan && !confirm('Replace your current trip with this JSON? Export a backup first if needed.')) return
    replacePlan(next);toast('Trip loaded from JSON')
  }
  async function importFile(event) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    if (file.size > 4_000_000) return toast('Choose a JSON file smaller than 4 MB.')
    try {
      const next = normalise(JSON.parse(await file.text()))
      if (state.hasSavedPlan && !confirm('Replace your current trip with this file? Export a backup first if needed.')) return
      replacePlan(next); toast('Trip imported')
    } catch (error) { toast('Could not import trip: ' + error.message) }
  }
  function filename(ext) { return (plan.name || 'my-trip').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70) + '-' + iso(new Date()) + '.' + ext }
  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a')
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
  function exportJSON() { saveBlob(new Blob([JSON.stringify(plan,null,2)], { type: 'application/json' }), filename('json')); state.needsBackup = false; toast('JSON backup downloaded') }
  async function sharePlan() {
    const file = new File([JSON.stringify(plan,null,2)], filename('json'), { type: 'application/json' })
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: plan.name }); state.needsBackup = false; return }
    } catch (error) { if (error.name === 'AbortError') return }
    exportJSON(); toast('JSON downloaded. Send this file to your friend.')
  }
  function moveActivity(id, from, to, beforeId) {
    if (to < plan.startDate || to > plan.endDate || beforeId === id) return
    const source = getDay(from).activities, index = source.findIndex(a => a.id === id)
    if (index < 0) return
    const [activity] = source.splice(index, 1), target = getDay(to).activities
    const before = beforeId ? target.findIndex(a => a.id === beforeId) : -1
    target.splice(before < 0 ? target.length : before, 0, activity)
    save()
    toast(from === to ? 'Activities are displayed by time. Edit the time to change the order.' : 'Activity moved to ' + niceDate(to, { day:'numeric', month:'short' }))
  }
function icsEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function exportICS(){let lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Roam Personal Planner//EN','CALSCALE:GREGORIAN'];for(const d of dayList(plan)){for(const a of activitiesByTime(plan.days[d]?.activities)){const stamp=d.replaceAll('-','');const time=(a.time&&/^\d{2}:\d{2}$/.test(a.time))?a.time.replace(':','')+'00':null;lines.push('BEGIN:VEVENT',`UID:${a.id.replace(/[^a-zA-Z0-9_-]/g,'')}@roam.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`);if(time){const endMinutes=(+a.time.slice(0,2)*60 + +a.time.slice(3)+60)%(24*60);const end=addDays(d,(+a.time.slice(0,2)*60 + +a.time.slice(3)+60)>=1440?1:0);lines.push(`DTSTART:${stamp}T${time}`,`DTEND:${end.replaceAll('-','')}T${String(Math.floor(endMinutes/60)).padStart(2,'0')}${String(endMinutes%60).padStart(2,'0')}00`)}else lines.push(`DTSTART;VALUE=DATE:${stamp}`,`DTEND;VALUE=DATE:${addDays(d,1).replaceAll('-','')}`);lines.push(`SUMMARY:${icsEscape(a.title)}`,`DESCRIPTION:${icsEscape(a.notes)}`,`LOCATION:${icsEscape(a.location)}`,'END:VEVENT');}}lines.push('END:VCALENDAR');saveBlob(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}),filename('ics'));toast('Calendar file downloaded');}
  return Object.assign(state, { save, toast, getDay, stayOn, openDay, setView, openEditor, saveEditor, applyJSON, deleteRecord, newTrip, finishSetup, dismissSetup, importJSON, importFile, exportJSON, sharePlan, exportICS, moveActivity })
}
