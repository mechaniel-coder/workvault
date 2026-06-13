import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distCandidates = [
  process.env.WORKVAULT_DIST_DIR,
  path.join(__dirname, 'dist'),
  path.join(__dirname, '../../dist'),
].filter(Boolean)

const distDir =
  distCandidates.find((dir) => fs.existsSync(path.join(dir!, 'index.html'))) ||
  path.join(__dirname, '../../dist')

const PORT = Number(process.env.PORT || 8080)
const API_UPSTREAM = (process.env.WORKVAULT_API_URL || 'https://workvault.netlify.app').replace(/\/$/, '')

const app = express()

app.use(
  '/api',
  createProxyMiddleware({
    target: API_UPSTREAM,
    changeOrigin: true,
  }),
)

app.use(express.static(distDir, { maxAge: '1h', index: false }))

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`WorkVault self-host listening on :${PORT} (API → ${API_UPSTREAM})`)
})
