// Pointer capture keeps touch and mouse dragging reliable; editors provide a keyboard alternative.
export function setupDrag(state, render) {
  let drag=null, frame
  const clearIndicators=()=>document.querySelectorAll('.target,.drop-before').forEach(node=>node.classList.remove('target','drop-before'))
  function locate() {
    const target=document.elementFromPoint(drag.x,drag.y)
    drag.to=target?.closest('[data-date-drop]')?.dataset.dateDrop || null
    const card=target?.closest('[data-activity-id]')
    drag.before=card?.dataset.activityId || null
    clearIndicators()
    target?.closest('[data-date-drop]')?.classList.add('target')
    if (drag.before!==drag.id) card?.classList.add('drop-before')
  }
  function scroll() {
    if (!drag?.active) return
    const edge=85
    if (drag.y<edge) window.scrollBy(0,-Math.ceil((edge-drag.y)/5))
    else if (drag.y>innerHeight-edge) window.scrollBy(0,Math.ceil((drag.y-innerHeight+edge)/5))
    locate(); frame=requestAnimationFrame(scroll)
  }
  function finish(cancel=false) {
    if (!drag) return
    const current=drag
    cancelAnimationFrame(frame); clearIndicators(); current.ghost?.remove(); drag=null
    if (current.active && current.to && !cancel) { state.moveActivity(current.id,current.from,current.to,current.before); render() }
  }
  document.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-drag]')
    if (!handle || event.button!==0) return
    event.preventDefault()
    drag={id:handle.dataset.drag,from:handle.dataset.date,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,active:false}
    handle.setPointerCapture(event.pointerId)
  })
  document.addEventListener('pointermove',event=>{
    if (!drag) return
    drag.x=event.clientX; drag.y=event.clientY
    if (!drag.active && Math.hypot(drag.x-drag.startX,drag.y-drag.startY)<5) return
    if (!drag.active) {
      drag.active=true
      drag.ghost=document.createElement('div');drag.ghost.className='drag-ghost'
      drag.ghost.textContent=state.getDay(drag.from).activities.find(a=>a.id===drag.id)?.title || 'Activity'
      document.body.append(drag.ghost); scroll()
    }
    drag.ghost.style.left=drag.x+'px';drag.ghost.style.top=drag.y+'px';locate()
  })
  document.addEventListener('pointerup',()=>finish())
  document.addEventListener('pointercancel',()=>finish(true))
  document.addEventListener('lostpointercapture',()=>finish(true))
}
