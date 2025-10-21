/** @type {import('next').NextConfig} */

const { makeEnvPublic } = require('next-runtime-env')

const nextConfig = {
  reactStrictMode: false, // <- This disables the double render in development
  output: 'standalone', // Enable standalone mode for Docker
  env: makeEnvPublic([
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
  ]),
}

// eslint-disable-next-line no-undef
module.exports = nextConfig
