export function normaliseBooking(record,path='Booking') {
  const price=record.price===undefined?'':record.price
  const currency=record.currency===undefined?'':record.currency
  const booked=record.booked===undefined?false:record.booked
  const paid=record.paid===undefined?false:record.paid
  if (price!=='' && (typeof price!=='number' || !Number.isFinite(price) || price<0)) throw new Error(`${path}.price must be a non-negative number, or "" when unknown.`)
  if (typeof currency!=='string' || (currency!=='' && !/^[A-Z]{3}$/.test(currency))) throw new Error(`${path}.currency must be a three-letter uppercase code such as GBP or CNY, or "".`)
  if (price>0 && !currency) throw new Error(`${path}.currency is required when a price is set.`)
  for (const [key,value] of [['booked',booked],['paid',paid]]) if (typeof value!=='boolean') throw new Error(`${path}.${key} must be true or false.`)
  return {price,currency,booked,paid}
}
export function bookingFromForm(draft) {
  return normaliseBooking({
    price:draft.price===undefined || draft.price===''?'':Number(draft.price),
    currency:String(draft.currency || '').trim().toUpperCase(),
    booked:draft.booked ?? false,paid:draft.paid ?? false,
  })
}
export function bookingPrice(record) {
  if (record.price==='' || record.price===undefined) return 'Price not set'
  if (record.price===0) return 'Free'
  try {return new Intl.NumberFormat('en-GB',{style:'currency',currency:record.currency,currencyDisplay:'code'}).format(record.price)}
  catch {return `${record.currency || ''} ${record.price}`.trim()}
}
