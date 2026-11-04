import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normaliseBooking, bookingFromForm, bookingPrice } from '../src/booking.js'
import { normalise } from '../src/plan.js'
import { parsePlanJSON } from '../src/plan-json.js'
const sample=JSON.parse(readFileSync(new URL('./fixtures/example-trip.json',import.meta.url)))
test('legacy trips load with unknown costs and unmarked statuses; confirmed metadata roundtrips',()=>{
  const old=structuredClone(sample)
  for(const record of [...old.stays,...Object.values(old.days).flatMap(day=>day.activities)]) for(const key of ['price','currency','booked','paid']) delete record[key]
  assert.deepEqual(normalise(old),sample)
  const plan=structuredClone(sample)
  Object.assign(plan.stays[0],{price:520.5,currency:'CNY',booked:true,paid:false})
  Object.assign(plan.days['2026-11-12'].activities[0],{price:80,currency:'CNY',booked:true,paid:true,done:false})
  assert.deepEqual(normalise(plan),plan)
  assert.deepEqual(parsePlanJSON(JSON.stringify(plan)),plan)
})
test('zero is free, blank is unknown, and booking/payment/completion remain independent',()=>{
  assert.equal(bookingPrice(normaliseBooking({price:0})),'Free')
  assert.equal(bookingPrice(normaliseBooking({})),'Price not set')
  assert.deepEqual(bookingFromForm({price:'100.25',currency:'cny',booked:true,paid:false}),{price:100.25,currency:'CNY',booked:true,paid:false})
  assert.deepEqual(normaliseBooking({paid:true,booked:false}),{price:'',currency:'',booked:false,paid:true})
})
test('invalid amounts, currencies and flags are rejected instead of being silently coerced',()=>{
  for(const record of [{price:-1,currency:'CNY'},{price:'100',currency:'CNY'},{price:null},{price:Infinity,currency:'CNY'},{price:10},{currency:'yuan'},{currency:'cny'},{booked:'true'},{paid:1}]) assert.throws(()=>normaliseBooking(record))
  for(const [field,value] of [['price',-1],['currency','CNY<script>'],['paid','true'],['booked',1]]) {
    const plan=structuredClone(sample);plan.stays[0][field]=value
    assert.throws(()=>parsePlanJSON(JSON.stringify(plan)))
    assert.throws(()=>normalise(plan))
  }
})
