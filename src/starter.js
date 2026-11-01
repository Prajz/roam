import { blankPlan, validDate, delta, addDays, uid, COLORS, normalise, dayList } from './plan.js'

export function validateBasics(draft) {
  if (!draft.name?.trim()) throw new Error('Give your trip a name.')
  if (!validDate(draft.startDate) || !validDate(draft.endDate) || draft.endDate < draft.startDate || delta(draft.startDate, draft.endDate) > 366) {
    throw new Error('Choose valid trip dates, up to one year apart. Include your travel days.')
  }
}
export function parsePlaces(text) {
  return String(text || '').split(/\n|,/).map(name => name.trim()).filter(Boolean)
}
export function validatePlaces(draft) {
  const places = parsePlaces(draft.places)
  if (!places.length) throw new Error('Add at least one place you would like to visit.')
  if (places.length > 12) throw new Error('Start with up to 12 places. You can add more later.')
  if (places.some(name => name.length > 150)) throw new Error('Keep each place name under 150 characters.')
  const nights = delta(draft.startDate, draft.endDate)
  if (places.length > Math.max(1, nights)) throw new Error('There are more places than nights. Add more time or start with fewer stops.')
  return places
}
function validateFlight(flight, draft) {
  if (!flight.from?.trim() || !flight.to?.trim()) throw new Error('Add the departure and arrival airports for each included flight.')
  if (!validDate(flight.departDate) || !validDate(flight.arriveDate) || flight.departDate < draft.startDate || flight.arriveDate > draft.endDate || flight.departDate > flight.arriveDate) {
    throw new Error('Flight dates must fit inside your trip, with arrival on or after departure. For overnight flights, choose the next arrival date.')
  }
  for (const time of [flight.departTime, flight.arriveTime]) {
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Use a valid flight time, or leave it blank for now.')
  }
}
const prompts = {
  sights: city => `Explore the neighbourhoods of ${city}`,
  food: city => `Try a local food spot in ${city}`,
  culture: city => `Visit a museum or cultural site in ${city}`,
  outdoors: city => `Find a park or scenic walk in ${city}`,
  shopping: city => `Browse local shops and markets in ${city}`,
}
const categories = { sights:'sightseeing', food:'food', culture:'sightseeing', outdoors:'adventure', shopping:'shopping' }

export function createStarter(draft) {
  validateBasics(draft)
  const places = validatePlaces(draft)
  const flights = (draft.flights || []).filter(flight => flight.enabled)
  for (const flight of flights) validateFlight(flight, draft)
  const outbound = flights.find(flight => flight.direction === 'outbound')
  const returning = flights.find(flight => flight.direction === 'return')
  const firstStay = outbound?.arriveDate || draft.startDate
  const lastStay = returning?.departDate || draft.endDate
  const nights = delta(firstStay, lastStay)
  if (nights < 0 || places.length > Math.max(1, nights)) {
    throw new Error('Your flights leave too little time for these stops. Change the flight dates, extend the trip or use fewer places.')
  }
  const interests = [...new Set((draft.interests || []).filter(key => Object.hasOwn(prompts,key)))]
  if (!interests.length) interests.push('sights', 'food')
  const pace = ['relaxed','balanced','busy'].includes(draft.pace) ? draft.pace : 'balanced'
  const dailyCount = { relaxed:1, balanced:2, busy:3 }[pace]
  const plan = {
    ...blankPlan(), name:draft.name.trim().slice(0,140), subtitle:places.join(' → ').slice(0,300),
    startDate:draft.startDate, endDate:draft.endDate,
    overview:`Starter itinerary · ${pace} pace.\nRoute: ${places.join(' → ')}\nStay dates are split evenly across your available nights. Activity ideas are prompts to research and edit; nothing is booked.${draft.notes?.trim() ? '\n\n' + draft.notes.trim() : ''}`,
    checklist:[
      'Confirm the route and adjust nights in each place',
      'Book accommodation and add the details to each stay',
      ...(places.length > 1 ? ['Choose transport between destinations and check travel times'] : []),
      flights.length ? 'Verify flight details, baggage and airport transfers' : 'Arrange your arrival and departure transport',
      'Check opening times and book any activities you choose',
      'Save tickets and addresses for offline use',
      'Export a JSON backup and share it with your travel companion',
    ].join('\n'),
  }
  const getDay = date => plan.days[date] ||= { overview:'', notes:'', activities:[] }
  const add = (date, title, category, notes='', time='', location='') => {
    getDay(date).activities.push({ id:uid(), title, time, location, category, notes, url:'', done:false })
  }
  let cursor = firstStay
  places.forEach((city,index) => {
    const duration = nights ? Math.floor(nights / places.length) + (index < nights % places.length ? 1 : 0) : 0
    const checkout = addDays(cursor,duration)
    if (duration) plan.stays.push({
      id:uid(), name:city, from:cursor, to:checkout, color:COLORS[index % COLORS.length], hotel:'', area:'',
      notes:'Suggested dates. Check travel times before booking.', ideas:interests.map(key => prompts[key](city)).join('\n'),
    })
    // The last destination includes departure day; other stops use check-out-exclusive dates.
    const lastDay = index === places.length - 1 ? checkout : addDays(checkout,-1)
    for (let date=cursor; date<=lastDay; date=addDays(date,1)) {
      const arrival = date===cursor, departure = index===places.length-1 && date===lastStay && nights>0
      const day = getDay(date)
      day.overview = departure ? `Last day in ${city}. Leave time for your onward journey.` : arrival ? `Arrive in ${city} and settle in.` : `A day to explore ${city}.`
      if (arrival && index>0) add(date,`Travel from ${places[index-1]} to ${city}`,'transport','Choose a train, bus or flight and confirm the journey time.')
      if (departure) continue
      const count = arrival ? 1 : dailyCount
      for (let item=0; item<Math.min(count,interests.length); item++) {
        const interest = interests[(delta(firstStay,date)+item) % interests.length]
        add(date,prompts[interest](city),categories[interest],'Idea only. Choose a place and check opening times before booking.')
      }
    }
    cursor=checkout
  })
  for (const flight of flights) {
    const number = flight.number?.trim() ? ` (${flight.number.trim()})` : ''
    add(flight.departDate,`Fly ${flight.from.trim()} → ${flight.to.trim()}${number}`,'transport',`Arrives ${flight.arriveDate}${flight.arriveTime ? ' at '+flight.arriveTime : ''}, local time. Verify flight details before travelling.`,flight.departTime || '',flight.from.trim())
    add(flight.arriveDate,`Arrive at ${flight.to.trim()}${number}`,'transport','Allow time for arrivals and the onward transfer.',flight.arriveTime || '',flight.to.trim())
  }
  for (const date of dayList(plan)) {
    const day = getDay(date)
    if (!day.overview) day.overview = 'Travel day. Check your connections and leave time for transfers.'
    // Known flight times come first; flexible ideas remain untimed.
    day.activities.sort((a,b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
  }
  return normalise(plan)
}
