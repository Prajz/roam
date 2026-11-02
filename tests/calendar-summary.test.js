import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calendarSummary } from '../src/calendar-summary.js'
const stays=[{id:'a',name:'Harbor City',from:'2027-03-01',to:'2027-03-04',color:'#ec7658'},{id:'b',name:'Old Town',from:'2027-03-04',to:'2027-03-07',color:'#7c9fe7'}]
test('city labels include check-out and transfer days without counting another overnight',()=>{
  const plan={stays,days:{}}
  assert.deepEqual(calendarSummary(plan,'2027-03-04').destinations.map(p=>p.name),['Harbor City','Old Town'])
  assert.deepEqual(calendarSummary(plan,'2027-03-07').destinations.map(p=>p.name),['Old Town'])
  assert.deepEqual(calendarSummary(plan,'2027-03-08').destinations,[])
  assert.equal(stays[1].to,'2027-03-07')
})
test('calendar previews prioritize activities over flights without changing the saved order',()=>{
  const activities=[{id:'flight',title:'Fly home',category:'transport'},{id:'arrival',title:'Land at home',category:'transport'},{id:'walk',title:'Explore the waterfront',category:'sightseeing'},{id:'food',title:'Lunch',category:'food'}]
  const plan={stays,days:{'2027-03-07':{activities}}}
  const before=JSON.stringify(plan)
  const summary=calendarSummary(plan,'2027-03-07')
  assert.deepEqual(summary.preview.map(a=>a.id),['walk','food'])
  assert.equal(summary.remaining,2)
  assert.equal(JSON.stringify(plan),before)
})
test('flight-only days use explicitly saved locations and keep flights when no other activities exist',()=>{
  const plan={stays,days:{'2027-02-28':{activities:[{id:'flight',title:'Fly out',category:'transport',location:'Home airport'},{id:'connection',title:'Connect',category:'transport',location:'Connection airport'}]}}}
  const summary=calendarSummary(plan,'2027-02-28')
  assert.deepEqual(summary.destinations.map(p=>p.name),['Home airport','Connection airport'])
  assert.equal(summary.preview.length,2)
})
