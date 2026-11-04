import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activitiesByTime } from '../src/activity-order.js'
test('orders the day from midnight through evening, with untimed and invalid times last',()=>{
  const activities=[{id:'untimed',time:''},{id:'evening',time:'20:00'},{id:'morning',time:'08:15'},{id:'midnight',time:'00:00'},{id:'legacy',time:'9:30'},{id:'invalid',time:'25:00'}]
  const original=structuredClone(activities)
  assert.deepEqual(activitiesByTime(activities).map(a=>a.id),['midnight','morning','legacy','evening','untimed','invalid'])
  assert.deepEqual(activities,original)
})
test('equal times and untimed ideas retain their existing relative order; edits change placement',()=>{
  const activities=[{id:'a',time:'10:00'},{id:'untimed-a',time:''},{id:'b',time:'10:00'},{id:'untimed-b'}]
  assert.deepEqual(activitiesByTime(activities).map(a=>a.id),['a','b','untimed-a','untimed-b'])
  activities[2].time='07:30'
  assert.deepEqual(activitiesByTime(activities).map(a=>a.id),['b','a','untimed-a','untimed-b'])
})
