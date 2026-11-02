// Calendar previews emphasize the place and things to do; the saved itinerary order stays intact.
export function calendarSummary(plan,date) {
  const activities=plan.days[date]?.activities || []
  const latest=stays=>[...stays].sort((a,b)=>a.from.localeCompare(b.from)).at(-1)
  const overnight=latest(plan.stays.filter(stay=>stay.from<=date && date<stay.to))
  const checkingOut=latest(plan.stays.filter(stay=>stay.to===date))
  const destinations=[]
  for (const stay of [checkingOut,overnight]) {
    if (stay && !destinations.some(place=>place.name===stay.name)) {
      destinations.push({name:stay.name,color:stay.color,checkout:stay===checkingOut})
    }
  }
  // A flight-only day can still show its explicitly saved airport/location, without guessing a city.
  if (!destinations.length) {
    for (const activity of activities) {
      const location=activity.location?.trim()
      if (location && !destinations.some(place=>place.name===location)) destinations.push({name:location,color:'#718092',checkout:false})
      if (destinations.length===2) break
    }
  }
  const preview=[...activities.filter(activity=>activity.category!=='transport'),...activities.filter(activity=>activity.category==='transport')].slice(0,2)
  return {destinations,preview,remaining:Math.max(0,activities.length-preview.length)}
}
