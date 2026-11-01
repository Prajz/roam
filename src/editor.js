import { COLORS, addDays } from './plan.js'
import { esc, button } from './html.js'
function field(name, label, value='', { type='text', extra='', textarea=false, placeholder='' }={}) {
  const id='edit-'+name
  return `<div class="field"><label for="${id}">${label}</label>${textarea?`<textarea id="${id}" name="${name}" ${extra} placeholder="${esc(placeholder)}">${esc(value)}</textarea>`:`<input id="${id}" name="${name}" type="${type}" value="${esc(value)}" ${extra} placeholder="${esc(placeholder)}">`}</div>`
}
const pair=(a,b)=>`<div class="fields-2">${a}${b}</div>`
export function editorContent(state) {
  const {editor,plan}=state, kind=editor.kind
  const draft=editor.record || (kind==='activity'
    ? {title:'',date:editor.date,time:'',category:'sightseeing',location:'',notes:'',url:'',done:false}
    : kind==='stay'
      ? {name:'',from:plan.startDate,to:addDays(plan.startDate,1),hotel:'',area:'',ideas:'',notes:'',color:COLORS[plan.stays.length%COLORS.length]}
      : {name:plan.name,subtitle:plan.subtitle,startDate:plan.startDate,endDate:plan.endDate})
  const heading=kind==='settings'?'Trip settings':kind==='activity'?(draft.id?'Edit activity':'Add an activity'):(draft.id?'Edit destination':'Add a destination')
  let fields=''
  if (kind==='activity') {
    const categories=[...new Set(['sightseeing','food','transport','hotel','shopping','adventure','other',draft.category])]
    fields=field('title','Activity name *',draft.title,{extra:'required maxlength="200" autofocus',placeholder:'e.g. Explore the old town'})
      +pair(field('date','Date',draft.date,{type:'date',extra:`required min="${plan.startDate}" max="${plan.endDate}"`}),field('time','Time (optional)',draft.time,{type:'time'}))
      +pair(`<div class="field"><label for="edit-category">Category</label><select id="edit-category" name="category">${categories.map(category=>`<option value="${esc(category)}" ${category===draft.category?'selected':''}>${esc(category)}</option>`).join('')}</select></div>`,field('location','Location / address',draft.location))
      +field('notes','Notes',draft.notes,{textarea:true})+field('url','Link (optional)',draft.url,{type:'url',placeholder:'https://…'})
      +`<label class="check-label"><input name="done" type="checkbox" ${draft.done?'checked':''}> Mark as completed</label>`
  } else if (kind==='stay') {
    fields=field('name','City or destination *',draft.name,{extra:'required maxlength="150" autofocus',placeholder:'e.g. Guangzhou'})
      +pair(field('from','Check-in *',draft.from,{type:'date',extra:`required min="${plan.startDate}" max="${plan.endDate}"`}),field('to','Check-out *',draft.to,{type:'date',extra:`required min="${addDays(draft.from,1)}" max="${addDays(plan.endDate,1)}"`}))
      +pair(field('hotel','Hotel / accommodation',draft.hotel),field('area','Neighbourhood',draft.area))
      +field('ideas','Things to see (commas or one per line)',draft.ideas,{textarea:true})+field('notes','City notes',draft.notes,{textarea:true})
      +`<fieldset class="color-field"><legend>Colour</legend>${COLORS.map((color,i)=>`<label><input type="radio" name="color" value="${color}" aria-label="Colour ${i+1}" ${color===draft.color?'checked':''}><span style="background:${color}"></span></label>`).join('')}</fieldset>`
  } else {
    fields=field('name','Trip name',draft.name,{extra:'required maxlength="140" autofocus'})+field('subtitle','Short description',draft.subtitle,{extra:'maxlength="300"'})
      +pair(field('startDate','Start date',draft.startDate,{type:'date',extra:'required'}),field('endDate','End date',draft.endDate,{type:'date',extra:`required min="${draft.startDate}"`}))
      +'<p class="tiny-help">Move or remove existing stays and activities before shortening your trip past them.</p>'
  }
  return `<div class="modal-head"><div><h2 id="editor-title">${heading}</h2><p>${kind==='settings'?'A name, a few dates, and somewhere to go.':kind==='activity'?'Make a plan. You can always move it later.':'Keep your dates, accommodation and ideas together.'}</p></div>${button('close-editor','','x','icon-btn','aria-label="Close editor"')}</div>
    <form id="editor-form">${fields}<p id="editor-error" class="form-error" role="alert" hidden></p><div class="modal-actions">${draft.id?button('delete','Delete','trash','btn','type="button"'):''}<div class="spacer"></div>${button('close-editor','Cancel',null,'btn','type="button"')}<button type="submit" class="btn primary">Save changes</button></div></form>`
}
