import { runtimeEnv } from './runtimeEnv'

export function siteBasePath(): string {
  const rawBasePath = runtimeEnv('NEXT_PUBLIC_SITE_BASE_PATH') || ''
  const withLeadingSlash = rawBasePath.startsWith('/')
    ? rawBasePath
    : `/${rawBasePath}`

  return withLeadingSlash.replace(/\/+$/, '')
}

export function sitePath(path: string = ''): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:')) {
    return path
  }

  const basePath = siteBasePath()
  if (!path || path === '/') return basePath || '/'

  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${basePath}${suffix}`
}

export function isSiteRoot(pathname: string): boolean {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/'
  return normalizedPathname === (siteBasePath() || '/')
}
