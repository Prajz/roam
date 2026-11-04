Update my existing Roam JSON to include hotel and activity booking/payment information. This extends schemaVersion 1; do not change the version or remove existing fields, IDs, dates, times, bookings or notes.

Add these fields to each object in stays and each activity in days[date].activities:

{
  "price": "",
  "currency": "",
  "booked": false,
  "paid": false
}

Rules:
- price: a non-negative JSON number, or "" when unknown. 0 means free. Do not use strings such as "£100" or "100 CNY".
- currency: an uppercase three-letter code such as GBP, CNY, EUR or USD. Use "" when unknown. Every positive price needs a currency.
- For a stay, price is the total hotel/accommodation cost for the whole stay, not per night.
- For an activity, price is the total cost of that activity entry. State whether it covers one person or the group in notes.
- booked: true only when a reservation is confirmed. Otherwise use false (not marked booked). A planned activity is not automatically booked.
- paid: true only when the entire amount has been paid. Otherwise use false (not marked paid). A booking can be unpaid. Put deposits, remaining balances and price estimates in notes.
- done is still activity completion. It is separate from booked and paid; never use it to infer either status.
- Preserve existing confirmed costs and statuses. Do not invent prices, bookings or payments. If the information is missing, use the defaults above and ask me for it when relevant.
- Keep checkInTime and checkOutTime on stays, using local HH:MM or "". Keep all other Roam format rules, including chronological activities, unique IDs and the existing category/colour lists.
- Continue to optimise travel geography, distance and door-to-door time. Prioritise high-speed rail, compare morning/evening transfers and include station/luggage/hotel buffers. Do not suggest new flights; retain already-booked flights as fixed constraints.
- Return the COMPLETE updated Roam JSON, not just the new fields. Do not add other unsupported keys such as cost, amountPaid or bookingStatus.

I will paste my current JSON next. Wait for it before updating.
