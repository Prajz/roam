import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStarter } from '../src/starter.js'
import { normalise, delta } from '../src/plan.js'
const draft = () => ({ name:'Coastal break',startDate:'2027-03-01',endDate:'2027-03-08',places:'Harbor City\nOld Town',pace:'balanced',interests:['food','culture'],notes:'Travel light',flights:[] })
test('starter distributes nights, labels transfer days and produces portable version 1 JSON',()=>{
  const plan=createStarter(draft())
  assert.deepEqual(plan.stays.map(s=>[s.name,s.from,s.to]),[['Harbor City','2027-03-01','2027-03-05'],['Old Town','2027-03-05','2027-03-08']])
  assert.equal(plan.stays.reduce((n,s)=>n+delta(s.from,s.to),0),7)
  assert(plan.days['2027-03-05'].activities.some(a=>a.title==='Travel from Harbor City to Old Town'))
  assert.equal(plan.days['2027-03-08'].activities.length,0)
  assert(plan.overview.includes('Travel light'))
  assert(plan.checklist.includes('Book accommodation'))
  assert.deepEqual(normalise(plan),plan)
})
test('overnight flights reserve the right travel dates and leave city nights between flights',()=>{
  const input=draft()
  input.flights=[{direction:'outbound',enabled:true,from:'Home airport',to:'Coastal airport',number:'AB123',departDate:'2027-03-01',departTime:'22:30',arriveDate:'2027-03-02',arriveTime:'07:00'},{direction:'return',enabled:true,from:'Coastal airport',to:'Home airport',departDate:'2027-03-07',departTime:'23:00',arriveDate:'2027-03-08',arriveTime:'06:00'}]
  const plan=createStarter(input)
  assert.equal(plan.stays[0].from,'2027-03-02')
  assert.equal(plan.stays.at(-1).to,'2027-03-07')
  assert(plan.days['2027-03-01'].activities.some(a=>a.title==='Fly Home airport → Coastal airport (AB123)' && a.time==='22:30'))
  assert(plan.days['2027-03-02'].activities.some(a=>a.title==='Arrive at Coastal airport (AB123)' && a.time==='07:00'))
  assert(plan.days['2027-03-08'].activities.some(a=>a.title==='Arrive at Home airport'))
  assert.deepEqual(normalise(plan),plan)
})
test('single-day trips, one-night trips and relaxed pace create usable bounded starters',()=>{
  const single=createStarter({...draft(),endDate:'2027-03-01',places:'Harbor City',pace:'relaxed'})
  assert.equal(single.stays.length,0)
  assert.equal(Object.keys(single.days).length,1)
  assert.equal(single.days['2027-03-01'].activities.length,1)
  const overnight=createStarter({...draft(),endDate:'2027-03-02',places:'Harbor City'})
  assert.equal(overnight.stays.length,1)
  assert.equal(overnight.stays[0].to,'2027-03-02')
})
test('reject impossible routes, dates and flight windows without silently dropping user input',()=>{
  for (const input of [{...draft(),places:''},{...draft(),startDate:'bad'},{...draft(),endDate:'2027-03-01'},{...draft(),flights:[{direction:'outbound',enabled:true,from:'A',to:'B',departDate:'2027-03-01',arriveDate:'2027-03-08'}]},{...draft(),flights:[{direction:'outbound',enabled:true,from:'A',to:'B',departDate:'2027-02-28',arriveDate:'2027-03-02'}]}]) assert.throws(()=>createStarter(input))
})
