import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pdfOverview, pdfHTML, withoutPrices } from '../src/pdf-overview.js'
import { dayList, addDays } from '../src/plan.js'
const sample=JSON.parse(readFileSync(new URL('./fixtures/example-trip.json',import.meta.url)))
test('PDF projection excludes finances, free-form notes, booking secrets and completion flags',()=>{
  const plan=structuredClone(sample)
  plan.overview='SECRET_OVERVIEW CNY 9000';plan.checklist='SECRET_CHECKLIST'
  plan.stays[0].price=98765.43;plan.stays[0].currency='CNY';plan.stays[0].paid=true
  plan.stays[0].notes='SECRET_STAY_NOTE';plan.stays[0].ideas='SECRET_IDEA'
  plan.days['2026-11-12'].notes='SECRET_DAY_NOTE'
  plan.days['2026-11-12'].overview='SECRET_DAY_OVERVIEW'
  Object.assign(plan.days['2026-11-12'].activities[0],{title:'Visit the museum (CNY 80)',location:'Waterfront - £50',price:87965.43,currency:'GBP',paid:true,booked:true,notes:'SECRET_ACTIVITY_NOTE',url:'https://example.com/SECRET_URL'})
  const report=pdfOverview(plan)
  const output=JSON.stringify(report)
  for (const secret of ['98765.43','87965.43','SECRET_','"price"','"currency"','"paid"','"booked"','"done"']) assert(!output.includes(secret),secret)
  assert.equal(report.days.find(day=>day.activities.some(a=>a.title==='Visit the museum')).activities[0].location,'Waterfront')
  const html=pdfHTML(plan)
  assert(!html.includes('SECRET_'))
  assert(!html.includes('CNY 80'))
})
test('overview includes contact names/emails, planned stay duration and every trip day without inventing activity lengths',()=>{
  const plan=structuredClone(sample)
  plan.stays[0].checkInTime='08:00';plan.stays[0].checkOutTime='18:00'
  const report=pdfOverview(plan,[{name:'Alex Traveller',email:'alex@example.test',phone:'+44 7700 900123'}])
  assert.equal(report.stays[0].length,'3 nights · 3 days, 10 hours planned stay')
  assert.deepEqual(report.contacts,[{name:'Alex Traveller',email:'alex@example.test',phone:'+44 7700 900123'}])
  const represented=[]
  for(const group of report.days) for(let date=group.from;date<=group.to;date=addDays(date,1)) represented.push(date)
  assert.deepEqual(represented,dayList(plan))
  assert(report.days.length<dayList(plan).length)
  assert.equal(report.activityCount,2)
  assert(pdfHTML(plan,report.contacts).includes('+44 7700 900123'))
  assert(!pdfHTML(plan).includes('Travel contacts'))
})
test('printed labels remove common currency amounts while preserving route times and escape user HTML',()=>{
  for(const value of ['Museum (CNY 80)','Museum - £50','Museum · 80 yuan per person','Museum ￥80','Museum 80元']) assert(!/80|50/.test(withoutPrices(value)))
  assert.equal(withoutPrices('Gate 12 at 18:30, Metro line 2'),'Gate 12 at 18:30, Metro line 2')
  assert.equal(withoutPrices('Museum BRL 80',['BRL']),'Museum')
  const plan=structuredClone(sample);plan.name='<img src=x onerror=alert(1)> 北京'
  const html=pdfHTML(plan,[{name:'<script>bad</script>',email:'alex@example.test'}])
  assert(!html.includes('<script>'));assert(!html.includes('<img'))
  assert(html.includes('&lt;script&gt;'));assert(html.includes('北京'))
})
