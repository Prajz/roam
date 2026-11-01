import './style.css'
import { createPlanner } from './planner.js'
import { shell, dayDetails } from './views.js'
import { editorContent } from './editor.js'
import { setupDrag } from './drag.js'
import { esc, button } from './html.js'
import { addDays, validDate } from './plan.js'

const app=document.getElementById('app')
app.innerHTML=`<a class="skip-link" href="#main">Skip to trip planner</a>
  <input id="import-input" type="file" accept=".json,application/json" hidden aria-label="Import trip JSON">
  <div id="planner"></div>
  <dialog class="day-drawer" aria-labelledby="day-title"></dialog>
  <dialog class="modal" aria-labelledby="editor-title"></dialog>
  <div id="toast-status" aria-live="polite" role="status"></div>`
const planner=document.getElementById('planner')
const dayDialog=document.querySelector('dialog.day-drawer')
const editorDialog=document.querySelector('dialog.modal')
const fileInput=document.getElementById('import-input')
const state=createPlanner(type=>type==='render'?render():updateStatus())
let renderedEditor=null
function updateStatus() {
  document.getElementById('toast-status').innerHTML=state.toastMessage?`<div class="toast">${esc(state.toastMessage)}</div>`:''
  const storage=document.getElementById('storage-status'), backup=document.getElementById('backup-status')
  if (storage) storage.innerHTML=state.storageError?`<p class="storage-error" role="alert">${esc(state.storageError)} ${button('export','Download backup')}</p>`:''
  if (backup) backup.innerHTML=`<span>${state.needsBackup?'You have changes since your last export.':'Your plans stay in this browser.'}</span> ${button('export','Download a JSON backup',null,'text-button')}`
}
function syncDialogs() {
  if (!state.editor) { editorDialog.close(); renderedEditor=null }
  if (state.drawerDate) {
    dayDialog.innerHTML=dayDetails(state)
    if (!dayDialog.open) dayDialog.showModal()
  } else dayDialog.close()
  if (state.editor && renderedEditor!==state.editor) {
    editorDialog.innerHTML=editorContent(state)
    renderedEditor=state.editor
    if (!editorDialog.open) editorDialog.showModal()
  }
}
function render() {
  document.title=state.plan.name+' · Roam'
  planner.innerHTML=shell(state)
  syncDialogs(); updateStatus()
}
function closeDay() { state.drawerDate=null; dayDialog.close(); render() }
function closeEditor() { state.editor=null; editorDialog.close(); renderedEditor=null }
for (const [dialog,close] of [[dayDialog,closeDay],[editorDialog,closeEditor]]) {
  dialog.addEventListener('cancel',event=>{event.preventDefault();close()})
  dialog.addEventListener('click',event=>{
    if (event.target!==dialog) return
    const bounds=dialog.getBoundingClientRect()
    if (event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom) close()
  })
}
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]')
  if (!target) return
  const {action,date,id,view}=target.dataset
  switch (action) {
    case 'view': state.setView(view);break
    case 'open-day': state.openDay(date);break
    case 'close-day': closeDay();return
    case 'add-activity': state.openEditor('activity',null,date);break
    case 'edit-activity': state.openEditor('activity',state.getDay(date).activities.find(a=>a.id===id),date);break
    case 'add-stay': state.openEditor('stay');break
    case 'edit-stay': state.openEditor('stay',state.plan.stays.find(s=>s.id===id));break
    case 'settings': state.openEditor('settings');break
    case 'close-editor': closeEditor();return
    case 'delete': state.deleteRecord();break
    case 'export': state.exportJSON();return
    case 'share': state.sharePlan();return
    case 'ics': state.exportICS();return
    case 'import': fileInput.click();return
    case 'new-trip': state.newTrip();return
    default: return
  }
  // Opening an editor must keep its parent drawer's focused controls intact.
  if (state.editor) syncDialogs()
  else render()
})
fileInput.addEventListener('change',event=>state.importFile(event))
document.addEventListener('input',event=>{
  const target=event.target
  if (target.dataset.save) { state.plan[target.dataset.save]=target.value; state.save() }
  else if (target.dataset.dayfield) { state.getDay(state.drawerDate)[target.dataset.dayfield]=target.value; state.save() }
  else if (target.name==='from' && validDate(target.value)) editorDialog.querySelector('[name=to]').min=addDays(target.value,1)
  else if (target.name==='startDate') editorDialog.querySelector('[name=endDate]').min=target.value
})
document.addEventListener('submit',event=>{
  if (event.target.id!=='editor-form') return
  event.preventDefault()
  const draft={...state.editor.record,...Object.fromEntries(new FormData(event.target))}
  if (state.editor.kind==='activity') draft.done=event.target.elements.done.checked
  state.saveEditor(draft)
  if (state.editor) {
    const error=document.getElementById('editor-error')
    error.textContent=state.editorError;error.hidden=!state.editorError
  } else { render(); state.save() }
})
setupDrag(state,render)
render()
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js').catch(()=>{})
}
