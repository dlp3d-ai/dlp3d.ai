const fs = require('fs')
const path = require('path')

const basePath = (process.env.NEXT_PUBLIC_SITE_BASE_PATH || '').replace(
  /\/+$/,
  '',
)

if (process.env.DEPLOY_TARGET !== 'github-pages' || !basePath) {
  process.exit(0)
}

const outDir = path.join(process.cwd(), 'out')
const cssUrlPattern = /url\((['"]?)(\/(?:img|models|characters)\/[^)'"]+)\1\)/g

function walk(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(entryPath)
    return entry.isFile() && entry.name.endsWith('.css') ? [entryPath] : []
  })
}

for (const file of walk(outDir)) {
  const source = fs.readFileSync(file, 'utf8')
  const rewritten = source.replace(
    cssUrlPattern,
    (_match, quote, assetPath) => `url(${quote}${basePath}${assetPath}${quote})`,
  )

  if (rewritten !== source) {
    fs.writeFileSync(file, rewritten)
  }
}
