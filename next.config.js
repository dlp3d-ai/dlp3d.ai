/** @type {import('next').NextConfig} */

const { makeEnvPublic } = require('next-runtime-env')

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages'
const rawSiteBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH || ''
const siteBasePath = rawSiteBasePath
  ? `/${rawSiteBasePath.replace(/^\/+|\/+$/g, '')}`
  : ''
const publicEnvKeys = [
  'NEXT_PUBLIC_DEPLOY_TARGET',
  'NEXT_PUBLIC_SITE_BASE_PATH',
  'NEXT_PUBLIC_ORCHESTRATOR_HOST',
  'NEXT_PUBLIC_ORCHESTRATOR_PORT',
  'NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX',
  'NEXT_PUBLIC_ORCHESTRATOR_TIMEOUT',
  'NEXT_PUBLIC_BACKEND_HOST',
  'NEXT_PUBLIC_BACKEND_PORT',
  'NEXT_PUBLIC_BACKEND_PATH_PREFIX',
  'NEXT_PUBLIC_MOTION_FILE_TIMEOUT',
  'NEXT_PUBLIC_MAX_FRONT_EXTENSION_DURATION',
  'NEXT_PUBLIC_MAX_REAR_EXTENSION_DURATION',
  'NEXT_PUBLIC_LANGUAGE',
]

if (!isGitHubPages) {
  makeEnvPublic(publicEnvKeys)
}

const nextConfig = {
  reactStrictMode: false, // <- This disables the double render in development
  output: isGitHubPages ? 'export' : 'standalone', // Keep Docker as the default target.
  ...(isGitHubPages
    ? {
        ...(siteBasePath
          ? {
              basePath: siteBasePath,
              assetPrefix: siteBasePath,
            }
          : {}),
        images: {
          unoptimized: true,
        },
      }
    : {}),
}

// eslint-disable-next-line no-undef
module.exports = nextConfig
