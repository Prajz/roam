import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parsePlanJSON } from '../src/plan-json.js'
const sample=JSON.parse(readFileSync(new URL('./fixtures/example-trip.json',import.meta.url)))
const clone=()=>structuredClone(sample)
test('JSON editor roundtrips a complete plan and supplies optional defaults',()=>{
  assert.deepEqual(parsePlanJSON(JSON.stringify(sample)),sample)
  const raw=clone();delete raw.overview;delete raw.stays[0].hotel;delete raw.days['2026-11-11'].activities[0].done
  const next=parsePlanJSON(JSON.stringify(raw))
  assert.equal(next.overview,'');assert.equal(next.stays[0].hotel,'');assert.equal(next.days['2026-11-11'].activities[0].done,false)
})
test('raw editor rejects syntax, schema and data that import normalization would silently drop',()=>{
  assert.throws(()=>parsePlanJSON('{broken'),/JSON syntax/)
  assert.throws(()=>parsePlanJSON('null'),/Trip must be an object/)
  for (const mutate of [
    p=>p.startDate='not-a-date',
    p=>p.startDate='2026-11-13',
    p=>p.days['2026-11-31']={activities:[]},
    p=>p.stays[0].to=p.stays[0].from,
    p=>p.stays[0].color='not-a-color',
    p=>p.stays[0].notes=42,
    p=>p.days['2026-11-11'].activities=[null],
    p=>p.days['2026-11-11'].activities[0].time='25:99',
    p=>p.days['2026-11-11'].activities[0].done='true',
    p=>p.name='x'.repeat(141),
    p=>p.budget=123,
    p=>p.days['2026-11-11'].activities[0].cost=20,
  ]) {
    const raw=clone();mutate(raw)
    assert.throws(()=>parsePlanJSON(JSON.stringify(raw)))
  }
  assert.throws(()=>parsePlanJSON(' '.repeat(4_000_001)),/under 4 MB/)
})
test('IDs must be present and unique across days; invalid drafts never mutate source plans',()=>{
  const repeated=clone()
  repeated.days['2026-11-12'].activities[0].id=repeated.days['2026-11-11'].activities[0].id
  const before=JSON.stringify(repeated)
  assert.throws(()=>parsePlanJSON(before),/duplicated/)
  assert.equal(JSON.stringify(repeated),before)
  const stays=clone();stays.stays[1].id=stays.stays[0].id
  assert.throws(()=>parsePlanJSON(JSON.stringify(stays)),/duplicated/)
  const missing=clone();delete missing.stays[0].id
  assert.throws(()=>parsePlanJSON(JSON.stringify(missing)),/non-empty/)
})
