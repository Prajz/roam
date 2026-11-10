import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const sample=JSON.parse(await readFile(new URL('../fixtures/example-trip.json',import.meta.url),'utf8'))
function exportFixture(){
  const plan=structuredClone(sample)
  plan.name='Coastal notebook · 海岸之旅'
  plan.overview='PRIVATE_OVERVIEW CNY 98765.43';plan.checklist='PRIVATE_CHECKLIST'
  Object.assign(plan.stays[0],{hotel:'The Harbour Hotel',checkInTime:'08:00',checkOutTime:'18:00',price:98765.43,currency:'CNY',booked:true,paid:true,notes:'PRIVATE_HOTEL_NOTE'})
  Object.assign(plan.days['2026-11-12'].activities[0],{title:'Museum visit (CNY 80)',price:87654.32,currency:'CNY',notes:'PRIVATE_ACTIVITY_NOTE',url:'https://example.com/PRIVATE_BOOKING'})
  return plan
}
async function load(page,plan){await page.goto('/');await page.locator('input[type=file]').setInputFiles({name:'trip.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(plan))});await expect(page.getByRole('heading',{name:plan.name,exact:true})).toBeVisible()}
async function openPDF(page){await page.getByRole('button',{name:'Trip notes',exact:true}).click();await page.locator('.file-actions').getByRole('button',{name:'Export PDF',exact:true}).click()}
test('PDF preview omits finances, supports optional contacts and uses the correct print document',async({page,context},info)=>{
  const plan=exportFixture(),errors=[];page.on('pageerror',error=>errors.push(error.message))
  await load(page,plan);const savedBefore=await page.evaluate(()=>localStorage.getItem('roam-personal-trip-v1'))
  await openPDF(page)
  await page.getByRole('button',{name:'Add a contact',exact:true}).click()
  await page.getByLabel('Contact 1 name',{exact:true}).fill('Alex Traveller')
  await page.getByLabel('Contact 1 email (optional)',{exact:true}).fill('alex@example.test')
  await page.getByLabel('Contact 1 phone (optional)',{exact:true}).fill('+44 7700 900123')
  await page.getByRole('button',{name:'Add a contact',exact:true}).click()
  await page.getByLabel('Contact 2 name',{exact:true}).fill('Sam Traveller')
  await page.getByLabel('Contact 2 email (optional)',{exact:true}).fill('sam@example.test')
  await page.getByRole('button',{name:'Preview PDF',exact:true}).click()
  await expect(page.getByRole('button',{name:'Save as PDF',exact:true})).toBeEnabled()
  const frame=page.frameLocator('iframe[title="Trip PDF preview"]')
  await expect(frame.getByRole('heading',{name:plan.name,exact:true})).toBeVisible()
  await expect(frame.getByText('alex@example.test',{exact:true})).toBeVisible()
  await expect(frame.getByText('+44 7700 900123',{exact:true})).toBeVisible()
  await expect(frame.getByText('sam@example.test',{exact:true})).toBeVisible()
  await expect(frame.getByText('3 nights · 3 days, 10 hours planned stay',{exact:true})).toBeVisible()
  const body=await frame.locator('body').innerText()
  for(const secret of ['98765.43','87654.32','CNY 80','PRIVATE_','Paid','Booked']) expect(body).not.toContain(secret)
  await expect(frame.getByText('Museum visit',{exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.screenshot({path:`test-results/${info.project.name}-pdf-preview.png`})
  const preview=page.frames().find(f=>f.parentFrame())
  await preview.evaluate(()=>{window.addEventListener('beforeprint',()=>{window.__printCalled=true},{once:true})})
  await page.getByRole('button',{name:'Save as PDF',exact:true}).click()
  await expect.poll(()=>preview.evaluate(()=>window.__printCalled)).toBe(true)
  if(info.project.name==='desktop'){
    const printable=await context.newPage();await printable.setContent(await preview.content())
    await printable.evaluate(()=>document.fonts.ready)
    await printable.pdf({path:'test-results/trip-overview.pdf',format:'A4',printBackground:true,preferCSSPageSize:true})
    await printable.close()
  }
  await page.getByRole('button',{name:'Edit contacts',exact:true}).click()
  await expect(page.getByLabel('Contact 1 name',{exact:true})).toHaveValue('Alex Traveller')
  await expect(page.getByLabel('Contact 1 phone (optional)',{exact:true})).toHaveValue('+44 7700 900123')
  await page.getByRole('button',{name:'Remove contact 2',exact:true}).click()
  await expect(page.getByLabel('Contact 2 name',{exact:true})).toHaveCount(0)
  await page.getByRole('button',{name:'Close PDF export',exact:true}).click()
  expect(await page.evaluate(()=>localStorage.getItem('roam-personal-trip-v1'))).toBe(savedBefore)
  await openPDF(page)
  await expect(page.getByLabel('Contact 1 name',{exact:true})).toHaveCount(0)
  await page.getByRole('button',{name:'Preview PDF',exact:true}).click()
  await expect(page.getByRole('button',{name:'Save as PDF',exact:true})).toBeEnabled()
  await expect(page.frameLocator('iframe').getByRole('heading',{name:'Travel contacts',exact:true})).toHaveCount(0)
  expect(errors).toEqual([])
})
test('long itineraries wrap safely and print across multiple pages',async({page,context},info)=>{
  test.skip(info.project.name!=='desktop','One print rendering is sufficient; mobile export is covered above')
  const plan=exportFixture()
  for(let day=12;day<=16;day++){
    const date=`2026-11-${day}`
    plan.days[date]={overview:'PRIVATE_LONG_OVERVIEW',notes:'PRIVATE_LONG_NOTE',activities:Array.from({length:13},(_,index)=>({id:`long-${day}-${index}`,title:`Day ${day} stop ${index+1}: explore neighbourhoods, galleries and the waterfront with a comfortably long descriptive title`,time:`${String(8+index).padStart(2,'0')}:00`,location:'A long location name with a walking route, a station exit and directions that should wrap cleanly',category:'sightseeing',notes:'PRIVATE_DETAILS',url:'',done:false,price:12345,currency:'CNY',paid:false,booked:false}))}
  }
  await load(page,plan);await openPDF(page);await page.getByRole('button',{name:'Preview PDF',exact:true}).click()
  await expect(page.getByRole('button',{name:'Save as PDF',exact:true})).toBeEnabled()
  const preview=page.frames().find(f=>f.parentFrame())
  const printable=await context.newPage();await printable.setContent(await preview.content())
  expect(await printable.locator('.activity').count()).toBe(66)
  expect(await printable.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await printable.evaluate(()=>document.fonts.ready)
    await printable.pdf({path:'test-results/trip-overview-long.pdf',format:'A4',printBackground:true,preferCSSPageSize:true})
  await printable.close()
})
