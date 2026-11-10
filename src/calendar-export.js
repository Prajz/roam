import { addDays, dayList } from './plan.js'
import { activitiesByTime } from './activity-order.js'
import { bookingPrice } from './booking.js'

function escapeText(value) {
  return String(value).replaceAll('\\','\\\\').replace(/\r\n|[\r\n]/g,'\\n').replaceAll(',','\\,').replaceAll(';','\\;')
}

// Calendar clients unfold CRLF + space. Count UTF-8 bytes without splitting characters.
function fold(line) {
  let result='', width=0
  for (const char of line) {
    const code=char.codePointAt(0)
    const bytes=code<128?1:code<2048?2:code<65536?3:4
    if (width+bytes>75) { result+='\r\n '; width=1 }
    result+=char
    width+=bytes
  }
  return result
}

function booking(record) {
  return [record.booked && 'Booked',record.paid && 'Paid',
    record.price!=='' && record.price!=null && bookingPrice(record)].filter(Boolean).join(' · ')
}

const compact=date=>date.replaceAll('-','')
function dates(start,end=addDays(start,1)) {
  return ['DTSTART;VALUE=DATE:'+compact(start),'DTEND;VALUE=DATE:'+compact(end)]
}

function schedule(date,time,hourLong=false) {
  const match=/^([01]?\d|2[0-3]):([0-5]\d)$/.exec((time || '').trim())
  if (!match) return dates(date)
  const hour=Number(match[1]), minute=match[2]
  const clock=h=>String(h).padStart(2,'0')+minute+'00'
  const lines=['DTSTART:'+compact(date)+'T'+clock(hour)]
  if (hourLong) lines.push('DTEND:'+compact(hour===23?addDays(date,1):date)+'T'+clock((hour+1)%24))
  return lines
}

export function tripCalendar(plan) {
  const name='Roam · '+plan.name
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Roam Personal Planner//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:'+escapeText(name)]
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')
  function event(id,range,title,details=[],location='') {
    lines.push('BEGIN:VEVENT','UID:'+escapeText(id)+'@roam.local','DTSTAMP:'+stamp,...range,'SUMMARY:'+escapeText(title))
    const description=details.filter(Boolean).join('\n\n')
    if (description) lines.push('DESCRIPTION:'+escapeText(description))
    if (location) lines.push('LOCATION:'+escapeText(location))
    lines.push('END:VEVENT')
  }
  const tripId=plan.startDate+'/'+plan.name
  event('trip/'+tripId,dates(plan.startDate,addDays(plan.endDate,1)),plan.name,
    [plan.subtitle,plan.overview,plan.checklist && 'Checklist\n'+plan.checklist])
  for (const stay of plan.stays) {
    const location=[stay.hotel,stay.area,stay.name].filter(Boolean).join(', ')
    event('stay/'+stay.id,dates(stay.from,stay.to),'Stay in '+stay.name,[stay.notes,stay.ideas,booking(stay)],location)
    for (const [label,date,time] of [['Check in',stay.from,stay.checkInTime],['Check out',stay.to,stay.checkOutTime]]) {
      event(label+'/'+stay.id,schedule(date,time),label+' · '+(stay.hotel || stay.name),[],location)
    }
  }
  for (const date of dayList(plan)) {
    const day=plan.days[date]
    if (!day) continue
    if (day.overview || day.notes) event('day/'+date+'/'+tripId,dates(date),'Day notes · '+plan.name,[day.overview,day.notes])
    for (const activity of activitiesByTime(day.activities)) {
      event(activity.id,schedule(date,activity.time,true),activity.title,
        [activity.category,activity.notes,activity.url,activity.done && 'Completed',booking(activity)],activity.location)
    }
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n')+'\r\n'
}
