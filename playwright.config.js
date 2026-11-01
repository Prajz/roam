import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  use: { baseURL:'http://127.0.0.1:4173', launchOptions: { executablePath: existsSync(chrome) ? chrome : undefined } },
  projects: [ { name:'desktop', use:{ viewport:{width:1440,height:1000} } }, { name:'mobile', use:{ viewport:{width:390,height:844}, isMobile:true, hasTouch:true } } ],
  webServer: { command:'node tests/serve.mjs', url:'http://127.0.0.1:4173', reuseExistingServer:!process.env.CI },
})
