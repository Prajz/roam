// Serve the production build both at / and /roam/ to exercise private-site subpaths.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
const root = resolve('dist')
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' }
http.createServer(async (request,response) => {
  try {
    let path = decodeURIComponent(new URL(request.url,'http://localhost').pathname)
    if (path.startsWith('/roam/')) path = path.slice(5)
    if (path.endsWith('/')) path += 'index.html'
    const file = resolve(root,'.' + path)
    if (!file.startsWith(root + '/')) { response.writeHead(403).end(); return }
    const body = await readFile(file)
    response.writeHead(200, { 'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache' }).end(body)
  } catch { response.writeHead(404).end('Not found') }
}).listen(4173,'127.0.0.1')
