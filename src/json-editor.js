import { esc, button } from './html.js'
import { parsePlanJSON } from './plan-json.js'

export function jsonEditorContent(plan) {
  return `<form id="json-form" data-settings-panel="json" hidden>
    <p id="json-help" class="json-help">Edit the saved plan directly. Changes apply only when you choose <strong>Apply JSON</strong>. Cancel leaves your plan unchanged.</p>
    <div class="json-toolbar"><label for="trip-json">Trip JSON</label><div>${button('json-format','Format JSON',null,'btn tiny','type="button"')}${button('json-reset','Reset draft',null,'btn tiny ghost','type="button"')}</div></div>
    <textarea id="trip-json" class="json-source" name="planJSON" spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off" wrap="off" aria-describedby="json-help json-validation" aria-invalid="false">${esc(JSON.stringify(plan,null,2))}</textarea>
    <p id="json-validation" class="json-validation" role="status" aria-live="polite"></p>
    <div class="modal-actions"><button type="button" class="btn" data-action="close-editor">Cancel</button><button id="apply-json" type="submit" class="btn primary">Apply JSON</button></div>
  </form>`
}

export function setupJSONEditor(dialog,state) {
  function validate() {
    const source=dialog.querySelector('#trip-json'), status=dialog.querySelector('#json-validation')
    if (!source || !status) return
    let message, valid=false, canFormat=false
    try {
      const next=parsePlanJSON(source.value)
      const activities=Object.values(next.days).reduce((n,day)=>n+day.activities.length,0)
      message=`Valid JSON · ${next.stays.length} stays · ${activities} activities. Ready to apply.`
      valid=true;canFormat=true
    } catch (error) {
      message=error.message
      try { JSON.parse(source.value);canFormat=true } catch {}
    }
    source.setAttribute('aria-invalid',String(!valid))
    status.classList.toggle('json-invalid',!valid)
    if (status.textContent !== message) status.textContent=message
    dialog.querySelector('#apply-json').disabled=!valid
    dialog.querySelector('[data-action="json-format"]').disabled=!canFormat
  }
  function initialize() {
    dialog.classList.remove('json-mode')
    validate()
  }
  function showTab(tab) {
    for (const panel of dialog.querySelectorAll('[data-settings-panel]')) panel.hidden=panel.dataset.settingsPanel!==tab
    for (const button of dialog.querySelectorAll('[data-settings-tab]')) {
      button.classList.toggle('selected',button.dataset.settingsTab===tab)
      button.setAttribute('aria-pressed',String(button.dataset.settingsTab===tab))
    }
    dialog.classList.toggle('json-mode',tab==='json')
    if (tab==='json') { validate();dialog.querySelector('#trip-json').focus({preventScroll:true}) }
  }
  function action(name) {
    const source=dialog.querySelector('#trip-json')
    if (!source) return false
    if (name==='json-format') {
      try { source.value=JSON.stringify(JSON.parse(source.value),null,2) } catch {}
    } else if (name==='json-reset') source.value=JSON.stringify(state.plan,null,2)
    else return false
    validate();source.focus({preventScroll:true})
    source.setSelectionRange(0,0);source.scrollTop=0;source.scrollLeft=0
    return true
  }
  dialog.addEventListener('click',event=>{
    const tab=event.target.closest('[data-settings-tab]')
    if (tab) showTab(tab.dataset.settingsTab)
  })
  dialog.addEventListener('input',event=>{if(event.target.id==='trip-json') validate()})
  dialog.addEventListener('submit',event=>{
    if (event.target.id!=='json-form') return
    event.preventDefault()
    try { state.applyJSON(dialog.querySelector('#trip-json').value) }
    catch { validate() }
  })
  return { initialize, action }
}
