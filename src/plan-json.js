import { normalise, validDate, validTime, addDays, COLORS } from './plan.js'

// Raw editing is stricter than file import: never silently drop or rewrite a draft.
const object = (value, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path} must be an object.`)
}
function keys(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${path}.${key} is not a supported field. Put extra details in notes or overview.`)
  }
}
function text(value, path, { required=false, max=Infinity }={}) {
  if (value === undefined && !required) return
  if (typeof value !== 'string' || (required && !value.trim())) throw new Error(`${path} must be ${required?'a non-empty':'a'} string.`)
  if (value.length > max) throw new Error(`${path} must be ${max} characters or fewer.`)
}
function records(value, path, limit) {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array.`)
  if (value.length > limit) throw new Error(`${path} supports up to ${limit} entries.`)
}
function id(value, path, seen) {
  text(value,path,{required:true})
  if (seen.has(value)) throw new Error(`${path} is duplicated. Give every entry its own id.`)
  seen.add(value)
}

export function parsePlanJSON(source) {
  if (new TextEncoder().encode(source).length > 4_000_000) throw new Error('Keep your trip JSON under 4 MB.')
  let raw
  try { raw=JSON.parse(source) }
  catch (error) { throw new Error('JSON syntax: '+error.message) }
  object(raw,'Trip')
  keys(raw,['schemaVersion','name','subtitle','startDate','endDate','overview','checklist','stays','days'],'Trip')
  if (raw.schemaVersion !== 1) throw new Error('schemaVersion must be 1.')
  text(raw.name,'name',{required:true,max:140})
  text(raw.subtitle,'subtitle',{max:300})
  for (const key of ['overview','checklist']) text(raw[key],key)
  if (!validDate(raw.startDate) || !validDate(raw.endDate) || raw.startDate > raw.endDate) throw new Error('Use valid startDate and endDate values in YYYY-MM-DD order.')
  // Check the shared date-range rule before examining the rest of the draft.
  normalise({ ...raw, stays:[], days:{} })
  records(raw.stays,'stays',300)
  const stayIds=new Set(), activityIds=new Set()
  for (const [index,stay] of raw.stays.entries()) {
    const path=`stays[${index}]`
    object(stay,path)
    keys(stay,['id','name','from','to','checkInTime','checkOutTime','color','hotel','area','notes','ideas'],path)
    id(stay.id,path+'.id',stayIds)
    text(stay.name,path+'.name',{required:true})
    if (!validDate(stay.from) || !validDate(stay.to) || stay.from >= stay.to) throw new Error(`${path}: check-out must be after check-in, using YYYY-MM-DD dates.`)
    if (stay.from < raw.startDate || stay.to > addDays(raw.endDate,1)) throw new Error(`${path}: stay dates must fit inside the trip (check-out can be the following day).`)
    for (const key of ['checkInTime','checkOutTime']) {
      if (stay[key] !== undefined && !validTime(stay[key])) throw new Error(`${path}.${key} must be HH:MM (24-hour), or empty.`)
    }
    if (stay.color !== undefined && !COLORS.includes(stay.color)) throw new Error(`${path}.color must use one of Roam’s existing destination colours.`)
    for (const key of ['hotel','area','notes','ideas']) text(stay[key],path+'.'+key)
  }
  object(raw.days,'days')
  for (const [date,day] of Object.entries(raw.days)) {
    const path=`days[${date}]`
    if (!validDate(date) || date < raw.startDate || date > raw.endDate) throw new Error(`${path}: every day must be a valid date inside the trip.`)
    object(day,path)
    keys(day,['overview','notes','activities'],path)
    for (const key of ['overview','notes']) text(day[key],path+'.'+key)
    if (day.activities === undefined) continue
    records(day.activities,path+'.activities',500)
    for (const [index,activity] of day.activities.entries()) {
      const item=`${path}.activities[${index}]`
      object(activity,item)
      keys(activity,['id','title','time','location','category','notes','url','done'],item)
      id(activity.id,item+'.id',activityIds)
      text(activity.title,item+'.title',{required:true})
      for (const key of ['time','location','category','notes','url']) text(activity[key],item+'.'+key)
      if (activity.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(activity.time)) throw new Error(`${item}.time must be HH:MM (24-hour), or empty.`)
      if (activity.done !== undefined && typeof activity.done !== 'boolean') throw new Error(`${item}.done must be true or false.`)
    }
  }
  return normalise(raw)
}
