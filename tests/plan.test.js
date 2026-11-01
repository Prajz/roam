import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalise, blankPlan, validDate, addDays, dayList, safeLink } from '../src/plan.js'
test('existing sample survives the Vite migration unchanged', () => {
  const sample=JSON.parse(readFileSync(new URL('../examples/china-2026.json',import.meta.url)))
  assert.deepEqual(normalise(sample),sample)
})
test('dates handle leap years and month boundaries without timezone conversion', () => {
  assert.equal(validDate('2026-02-29'),false)
  assert.equal(validDate('2028-02-29'),true)
  assert.equal(addDays('2026-12-31',1),'2027-01-01')
  assert.equal(dayList({...blankPlan(),startDate:'2028-02-28',endDate:'2028-03-01'}).length,3)
})
test('invalid schemas, reversed dates, excessive ranges and unsafe links are rejected', () => {
  for (const raw of [null,[],{}, {...blankPlan(),schemaVersion:2}, {...blankPlan(),startDate:'2028-01-01',endDate:'2026-01-01'}, {...blankPlan(),startDate:'2026-01-01',endDate:'2028-01-01'}]) assert.throws(()=>normalise(raw))
  assert.equal(safeLink('javascript:alert(1)'),null)
  assert.equal(safeLink('https://example.com'),'https://example.com/')
})
