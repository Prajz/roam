import { esc, icon, button } from './html.js'
import { pdfHTML } from './pdf-overview.js'

export function setupPDFExport(state) {
  const dialog=document.createElement('dialog')
  dialog.className='modal pdf-modal';dialog.setAttribute('aria-labelledby','pdf-title')
  let contacts=[],snapshot=null,previewHTML=''
  const readContacts=()=>[...dialog.querySelectorAll('[data-pdf-contact]')].map(row=>({
    name:row.querySelector('[data-contact-field="name"]').value,
    phone:row.querySelector('[data-contact-field="phone"]').value,
    email:row.querySelector('[data-contact-field="email"]').value,
  }))
  function close(){dialog.close();dialog.innerHTML='';contacts=[];snapshot=null;previewHTML=''}
  function options(){
    dialog.classList.remove('pdf-preview-mode')
    dialog.innerHTML=`<div class="modal-head"><div><h2 id="pdf-title">Export trip PDF</h2><p>A tidy overview of your dates, places, time in each destination and daily activities.</p></div>${button('pdf-close','','x','icon-btn','type="button" aria-label="Close PDF export"')}</div>
      <p class="pdf-privacy">Prices, payment statuses and free-form notes are left out.</p>
      <form id="pdf-options-form"><fieldset class="pdf-contacts"><legend>Contacts (optional)</legend><p class="tiny-help">Add a contact’s name, email and phone number, or skip this step. Contacts are only included in this export.</p>
      <div class="pdf-contact-list">${contacts.map((contact,index)=>`<div class="pdf-contact" data-pdf-contact><div class="pdf-contact-heading"><strong>Contact ${index+1}</strong><button type="button" class="text-button" data-pdf-remove="${index}" aria-label="Remove contact ${index+1}">Remove</button></div><div class="field"><label for="pdf-contact-name-${index}">Contact ${index+1} name</label><input id="pdf-contact-name-${index}" data-contact-field="name" value="${esc(contact.name)}" required maxlength="100" autocomplete="off"></div><div class="field"><label for="pdf-contact-email-${index}">Contact ${index+1} email (optional)</label><input id="pdf-contact-email-${index}" data-contact-field="email" type="email" value="${esc(contact.email)}" maxlength="254" autocomplete="off"></div><div class="field"><label for="pdf-contact-phone-${index}">Contact ${index+1} phone (optional)</label><input id="pdf-contact-phone-${index}" data-contact-field="phone" type="tel" value="${esc(contact.phone || '')}" maxlength="60" autocomplete="off"></div></div>`).join('')}</div>
      <button type="button" class="btn" data-pdf-add ${contacts.length>=10?'disabled':''}>${icon('plus')} Add a contact</button></fieldset>
      <div class="modal-actions"><button type="button" class="btn" data-action="pdf-close">Cancel</button><button type="submit" class="btn primary">Preview PDF ${icon('chevron')}</button></div></form>`
  }
  function preview(){
    previewHTML=pdfHTML(snapshot,contacts)
    dialog.classList.add('pdf-preview-mode')
    dialog.innerHTML=`<div class="modal-head"><div><h2 id="pdf-title">Your trip overview</h2><p>Choose Save as PDF in your browser’s print dialog. For the cleanest copy, turn off browser headers and footers.</p></div>${button('pdf-close','','x','icon-btn','type="button" aria-label="Close PDF export"')}</div><div class="pdf-preview-actions"><button type="button" class="btn" data-pdf-back>Edit contacts</button><button type="button" class="btn primary" data-pdf-print disabled>${icon('download')} Save as PDF</button></div><iframe class="pdf-preview-frame" title="Trip PDF preview" sandbox="allow-same-origin allow-modals allow-scripts"></iframe>`
    const frame=dialog.querySelector('iframe')
    frame.addEventListener('load',()=>{dialog.querySelector('[data-pdf-print]').disabled=false},{once:true})
    frame.srcdoc=previewHTML
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();close()})
  dialog.addEventListener('click',event=>{
    const target=event.target.closest('button')
    if (!target) return
    if (target.dataset.action==='pdf-close'){close();return}
    if (target.hasAttribute('data-pdf-add')){contacts=readContacts();contacts.push({name:'',email:'',phone:''});options();dialog.querySelector(`#pdf-contact-name-${contacts.length-1}`).focus()}
    if (target.hasAttribute('data-pdf-remove')){const index=+target.dataset.pdfRemove;contacts=readContacts();contacts.splice(index,1);options();dialog.querySelector('[data-pdf-add]').focus()}
    if (target.hasAttribute('data-pdf-back'))options()
    if (target.hasAttribute('data-pdf-print')){
      const frame=dialog.querySelector('iframe')
      frame.contentWindow.focus();frame.contentWindow.print()
    }
  })
  dialog.addEventListener('submit',event=>{
    if(event.target.id!=='pdf-options-form')return
    event.preventDefault();contacts=readContacts().map(c=>({name:c.name.trim(),email:c.email.trim(),phone:c.phone.trim()}))
    const empty=contacts.findIndex(c=>!c.name)
    if(empty>=0){const input=dialog.querySelector(`#pdf-contact-name-${empty}`);input.setCustomValidity('Enter a name, or remove this contact.');input.reportValidity();return}
    preview()
  })
  dialog.addEventListener('input',event=>{if(event.target.matches('[data-contact-field="name"]'))event.target.setCustomValidity('')})
  return {open(){if(!dialog.isConnected)document.body.append(dialog);snapshot=structuredClone(state.plan);contacts=[];options();dialog.showModal()}}
}
