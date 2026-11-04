function minutes(activity) {
  // Accept older imported H:MM times as well as the editor's canonical HH:MM.
  const match=/^(\d{1,2}):(\d{2})$/.exec(String(activity.time || '').trim())
  if (!match || +match[1]>23 || +match[2]>59) return Infinity
  return +match[1]*60 + +match[2]
}
export function activitiesByTime(activities=[]) {
  // Sort a copy so viewing a trip never rewrites its JSON or same-time manual order.
  return [...activities].sort((a,b)=>{
    const first=minutes(a),second=minutes(b)
    return first===second?0:first-second
  })
}
