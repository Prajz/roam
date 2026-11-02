import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalise, validTime } from '../src/plan.js'
import { parsePlanJSON } from '../src/plan-json.js'
import { calendarSummary, stayTransitions } from '../src/calendar-summary.js'
const sample=JSON.parse(readFileSync(new URL('./fixtures/example-trip.json',import.meta.url)))
test('stay times survive normalization and raw JSON editing, while legacy files default to empty times',()=>{
  const input=structuredClone(sample)
  input.stays[0].checkInTime='08:30';input.stays[0].checkOutTime='18:15'
  assert.deepEqual(normalise(input),input)
  assert.deepEqual(parsePlanJSON(JSON.stringify(input)),input)
  delete input.stays[0].checkInTime;delete input.stays[0].checkOutTime
  const restored=normalise(input)
  assert.equal(restored.stays[0].checkInTime,'');assert.equal(restored.stays[0].checkOutTime,'')
  assert.equal(restored.stays[0].to,sample.stays[0].to)
})
test('invalid stay times are rejected in file imports and JSON editing',()=>{
  for (const value of ['25:00','12:60','8:00','morning',null,8]) {
    const input=structuredClone(sample);input.stays[0].checkOutTime=value
    assert.throws(()=>normalise(input),/Stay times/)
    assert.throws(()=>parsePlanJSON(JSON.stringify(input)),/checkOutTime/)
  }
  for (const value of ['', '00:00','23:59','09:00']) assert.equal(validTime(value),true)
})
test('calendar labels and daily transitions show morning/evening times without adding nights',()=>{
  const plan=structuredClone(sample)
  plan.stays[0].checkOutTime='09:00';plan.stays[1].checkInTime='14:30'
  const summary=calendarSummary(plan,'2026-11-15')
  assert.deepEqual(summary.destinations.map(place=>place.timeLabel),['Out 09:00','In 14:30'])
  assert.deepEqual(stayTransitions(plan,'2026-11-15').map(item=>[item.label,item.time]),[['Leave Harbor City','09:00'],['Arrive in Old Town','14:30']])
  assert.equal(plan.stays[0].to,'2026-11-15')
  assert.equal(calendarSummary(plan,'2026-11-16').destinations[0].timeLabel,'')
})
