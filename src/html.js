import { ICONS } from './plan.js'
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
}
export function icon(name = 'compass') {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.compass}</svg>`
}
export function button(action, label, iconName, className = 'btn', attributes = '') {
  return `<button class="${className}" data-action="${action}" ${attributes}>${iconName ? icon(iconName) : ''}${label}</button>`
}
