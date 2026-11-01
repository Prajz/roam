import { esc, icon, button } from './html.js'
import { blankPlan, validDate } from './plan.js'
import { parsePlanJSON } from './plan-json.js'
import { validateBasics, validatePlaces, createStarter } from './starter.js'

export function createOnboarding(state, render) {
  let step=0, error='', jsonDraft='', draft
  function reset() {
    const blank=blankPlan()
    draft={ name:'', startDate:blank.startDate, endDate:blank.endDate, places:'', pace:'balanced', interests:['sights','food'], notes:'', flights:[] }
    step=0; error=''; jsonDraft=''
  }
  reset()
  function input(name,label,value='',type='text',extra='') {
    return `<div class="field"><label for="setup-${name}">${label}</label><input id="setup-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`
  }
  function flightFields(direction,label) {
    const flight=draft.flights.find(item=>item.direction===direction) || {}
    const date=direction==='outbound'?draft.startDate:draft.endDate
    return `<details class="flight-setup" ${flight.enabled?'open':''}><summary>${label} <span>Optional</span></summary><label class="check-label"><input name="${direction}-enabled" type="checkbox" ${flight.enabled?'checked':''}> Add this flight to the plan</label>
    <fieldset ${flight.enabled?'':'disabled'} data-flight="${direction}"><legend class="sr-only">${label} details</legend>
    <div class="fields-2">${input(direction+'-from','From airport',flight.from || '', 'text','maxlength="150" required')}${input(direction+'-to','To airport',flight.to || '', 'text','maxlength="150" required')}</div>
    ${input(direction+'-number','Flight number (optional)',flight.number || '', 'text','maxlength="40"')}
    <div class="fields-2">${input(direction+'-departDate','Departure date',flight.departDate || date,'date',`required min="${draft.startDate}" max="${draft.endDate}"`)}${input(direction+'-departTime','Departure time (optional)',flight.departTime || '','time')}</div>
    <div class="fields-2">${input(direction+'-arriveDate','Arrival date',flight.arriveDate || date,'date',`required min="${draft.startDate}" max="${draft.endDate}"`)}${input(direction+'-arriveTime','Arrival time (optional)',flight.arriveTime || '','time')}</div>
    </fieldset></details>`
  }
  function content() {
    const welcome=`<div class="setup-intro"><div class="eyebrow">A LITTLE PLANNING. A LOT TO LOOK FORWARD TO.</div><h1 id="setup-title">Let’s get your trip started.</h1><p>Already have a Roam JSON plan, or shall we put together a first draft?</p></div>
      <div class="setup-choices"><button class="setup-choice" data-action="import">${icon('upload')}<strong>I have a JSON plan</strong><span>Upload a shared plan or a backup from your device.</span></button><button class="setup-choice" data-action="setup-start">${icon('compass')}<strong>Plan a new trip</strong><span>A few questions about dates, places and flights.</span></button></div>
      <details class="setup-json"><summary>Paste or type JSON instead</summary><form id="setup-json-form">
        <p id="setup-json-help" class="tiny-help">Paste a complete Roam plan, or edit the JSON here before loading it.</p>
        <label for="setup-json-source" class="setup-json-label">Your trip JSON</label>
        <textarea id="setup-json-source" name="json" class="json-source" spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off" wrap="off" aria-describedby="setup-json-help setup-json-validation" aria-invalid="${Boolean(jsonDraft.trim()) && !jsonFeedback().valid}" placeholder='{"schemaVersion": 1, ...}'>${esc(jsonDraft)}</textarea>
        <p id="setup-json-validation" class="json-validation ${jsonDraft.trim() && !jsonFeedback().valid?'json-invalid':''}" role="status" aria-live="polite">${esc(jsonFeedback().message)}</p>
        <div class="setup-json-actions"><button id="setup-json-load" type="submit" class="btn primary" ${jsonFeedback().valid?'':'disabled'}>Load this plan ${icon('chevron')}</button></div>
      </form></details>
      <p class="setup-local">${icon('note')} Your plan saves in this browser. Share a JSON file when you’re ready.</p>`
    const headings=['','First, the essentials.','Where are you heading?','Any flights to add?']
    const descriptions=['','Include your travel days. You can change everything later.','List your stops in the order you want to visit them. We’ll split the nights evenly to get you started.','Add the flights you know, or leave this blank and add them later. All times are local to each airport.']
    let fields=''
    if (step===1) fields=input('name','Trip name',draft.name,'text','required maxlength="140" placeholder="e.g. A week in Portugal" autofocus')+`<div class="fields-2">${input('startDate','Start date',draft.startDate,'date','required')}${input('endDate','End date',draft.endDate,'date',`required min="${draft.startDate}"`)}</div>`
    if (step===2) fields=`<div class="field"><label for="setup-places">Places to visit, in order</label><textarea id="setup-places" name="places" rows="3" required placeholder="Lisbon\nPorto" autofocus>${esc(draft.places)}</textarea><span class="hint">One place per line, or separate them with commas. Up to 12 stops.</span></div>
      <div class="field"><label for="setup-pace">Your travel pace</label><select id="setup-pace" name="pace">${[['relaxed','Take it easy · one idea a day'],['balanced','A bit of everything · up to two ideas a day'],['busy','Fit more in · up to three ideas a day']].map(([value,label])=>`<option value="${value}" ${value===draft.pace?'selected':''}>${label}</option>`).join('')}</select></div>
      <fieldset class="setup-interests"><legend>What do you enjoy?</legend>${[['sights','Exploring'],['food','Food'],['culture','Culture'],['outdoors','Outdoors'],['shopping','Shopping']].map(([value,label])=>`<label><input type="checkbox" name="interests" value="${value}" ${draft.interests.includes(value)?'checked':''}>${label}</label>`).join('')}</fieldset>
      <div class="field"><label for="setup-notes">Anything else? (optional)</label><textarea id="setup-notes" name="notes" placeholder="Budget, must-dos, who’s coming…" maxlength="4000">${esc(draft.notes)}</textarea></div>`
    if (step===3) fields=`<div class="setup-summary"><strong>${esc(draft.name)}</strong><span>${esc(draft.startDate)} → ${esc(draft.endDate)}</span><span>${esc(draft.places.split(/\n|,/).map(s=>s.trim()).filter(Boolean).join(' → '))}</span></div>${flightFields('outbound','Outbound flight')}${flightFields('return','Return flight')}<p class="tiny-help">Flying overnight? Set the arrival date separately. Stay dates will fit between your arrival and return departure. Activities are editable ideas; nothing is booked.</p>`
    return `<main id="main" class="setup-shell" aria-labelledby="setup-title"><header class="setup-brand"><div class="brand-mark">${icon('compass')}</div><span>roam<span class="brand-dot">.</span></span></header><div id="storage-status"></div>
      ${step===0?welcome:`<div class="setup-intro"><div class="setup-progress" aria-label="Step ${step} of 3"><span>Step ${step} of 3</span><div>${[1,2,3].map(n=>`<i class="${n<=step?'filled':''}"></i>`).join('')}</div></div><h1 id="setup-title" tabindex="-1">${headings[step]}</h1><p>${descriptions[step]}</p></div><form id="setup-form">${fields}<p id="setup-error" class="form-error" role="alert" ${error?'':'hidden'}>${esc(error)}</p><div class="setup-actions">${button('setup-back','Back',null,'btn','type="button"')}<button class="btn primary" type="submit">${step===3?'Create my trip':'Continue'} ${icon(step===3?'check':'chevron')}</button></div></form>`}
      <button class="text-button setup-skip" data-action="setup-skip">${state.hasSavedPlan?'Keep my current trip':'Skip for now'}</button></main>`
  }
  function jsonFeedback() {
    if (!jsonDraft.trim()) return {valid:false,message:'Paste or type your complete JSON plan to get started.'}
    try {
      const plan=parsePlanJSON(jsonDraft)
      return {valid:true,message:`Ready to load “${plan.name}” · ${plan.stays.length} stays.`}
    } catch (issue) { return {valid:false,message:issue.message} }
  }
  function validateJSON() {
    const result=jsonFeedback(), source=document.getElementById('setup-json-source'), status=document.getElementById('setup-json-validation')
    if (!source || !status) return
    source.setAttribute('aria-invalid',String(Boolean(jsonDraft.trim()) && !result.valid))
    status.textContent=result.message
    status.classList.toggle('json-invalid',Boolean(jsonDraft.trim()) && !result.valid)
    document.getElementById('setup-json-load').disabled=!result.valid
  }
  function submitJSON(form) {
    jsonDraft=form.elements.json.value
    try { state.importJSON(jsonDraft) }
    catch { validateJSON() }
  }
  function capture(form) {
    const values=new FormData(form)
    if (step===1) for (const key of ['name','startDate','endDate']) draft[key]=values.get(key) || ''
    if (step===2) { for (const key of ['places','pace','notes']) draft[key]=values.get(key) || ''; draft.interests=values.getAll('interests') }
    if (step===3) draft.flights=['outbound','return'].map(direction=>{
      const previous=draft.flights.find(f=>f.direction===direction) || {}
      const flight={...previous,direction,enabled:values.has(direction+'-enabled')}
      for (const key of ['from','to','number','departDate','departTime','arriveDate','arriveTime']) if (values.has(direction+'-'+key)) flight[key]=values.get(direction+'-'+key)
      return flight
    })
  }
  function redraw() { render(); document.getElementById('setup-title')?.focus() }
  function submit(form) {
    capture(form)
    try {
      if (step===1) validateBasics(draft)
      if (step===2) validatePlaces(draft)
      if (step===3) { state.finishSetup(createStarter(draft)); return }
      step++; error=''; redraw()
    } catch (issue) {
      error=issue.message
      const node=document.getElementById('setup-error');node.textContent=error;node.hidden=false;node.scrollIntoView({block:'nearest'})
    }
  }
  function action(name) {
    if (name==='setup-start') { step=1;error='';redraw() }
    else if (name==='setup-back') { const form=document.getElementById('setup-form');if(form) capture(form);step=Math.max(0,step-1);error='';redraw() }
    else if (name==='setup-skip') state.dismissSetup()
    else return false
    return true
  }
  function change(target) {
    if (target.id==='setup-json-source') { jsonDraft=target.value;validateJSON();return }
    if (target.name?.endsWith('-enabled')) {
      const fieldset=target.closest('details').querySelector('fieldset');fieldset.disabled=!target.checked
    }
    if (target.name==='startDate' && validDate(target.value)) document.getElementById('setup-endDate').min=target.value
    if (target.name?.endsWith('-departDate') && validDate(target.value)) {
      const direction=target.name.split('-')[0], arrival=document.getElementById('setup-'+direction+'-arriveDate')
      arrival.min=target.value
    }
  }
  return { content, submit, submitJSON, action, change, reset }
}
