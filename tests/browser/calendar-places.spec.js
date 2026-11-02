import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const sample=JSON.parse(await readFile(new URL('../fixtures/example-trip.json',import.meta.url),'utf8'))
const activity=(id,title,category,location='')=>({id,title,category,location,time:'',notes:'',url:'',done:false})
test('calendar keeps places visible and highlights activities before flights',async({page},info)=>{
  const plan=structuredClone(sample)
  plan.days['2026-11-11'].activities[0].location='Home airport'
  plan.days['2026-11-12'].activities=[activity('f1','Fly to the coast','transport','Coastal airport'),activity('f2','Flight connection','transport','Connection airport'),activity('visit','Explore the waterfront','sightseeing'),activity('lunch','Lunch by the harbour','food')]
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles({name:'trip.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(plan))})
  const first=page.getByRole('button',{name:'Wednesday, 11 November 2026',exact:true})
  await expect(first.locator('.city-pill')).toContainText('Home airport')
  const arrival=page.getByRole('button',{name:'Thursday, 12 November 2026',exact:true})
  await expect(arrival.locator('.city-pill')).toBeVisible()
  await expect(arrival.locator('.city-pill')).toContainText('Harbor City')
  await expect(arrival.locator('.cal-activity')).toHaveText([' Explore the waterfront',' Lunch by the harbour'])
  const transfer=page.getByRole('button',{name:'Sunday, 15 November 2026',exact:true})
  await expect(transfer.locator('.city-pill')).toHaveText(['↗ Harbor City','● Old Town'])
  const checkout=page.getByRole('button',{name:'Thursday, 3 December 2026',exact:true})
  await expect(checkout.locator('.city-pill')).toContainText('Old Town')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('roam-personal-trip-v1')))).toEqual(plan)
  await page.screenshot({path:`test-results/${info.project.name}-calendar-places.png`,fullPage:true})
  await arrival.click()
  await expect(page.getByText('Fly to the coast',{exact:true})).toBeVisible()
  await expect(page.getByText('Flight connection',{exact:true})).toBeVisible()
})
