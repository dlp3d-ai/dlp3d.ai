import ky from 'ky'
import type { KyRequest, NormalizedOptions } from 'ky'
import https from 'https'
import { env } from 'next-runtime-env'

/**
 * Environment variable for the orchestrator host.
 */
const NEXT_PUBLIC_ORCHESTRATOR_HOST = env('NEXT_PUBLIC_ORCHESTRATOR_HOST')
/**
 * Environment variable for the orchestrator port.
 */
const NEXT_PUBLIC_ORCHESTRATOR_PORT = env('NEXT_PUBLIC_ORCHESTRATOR_PORT')
/**
 * Environment variable for the orchestrator path prefix.
 */
const NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX = env(
  'NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX',
)
/**
 * Environment variable for the backend host.
 */
const NEXT_PUBLIC_BACKEND_HOST = env('NEXT_PUBLIC_BACKEND_HOST')
/**
 * Environment variable for the backend port.
 */
const NEXT_PUBLIC_BACKEND_PORT = env('NEXT_PUBLIC_BACKEND_PORT')
/**
 * Environment variable for the backend path prefix.
 */
const NEXT_PUBLIC_BACKEND_PATH_PREFIX = env('NEXT_PUBLIC_BACKEND_PATH_PREFIX')

/**
 * HTTPS agent configuration that allows self-signed certificates.
 */
const agent = new https.Agent({
  rejectUnauthorized: false,
})

/**
 * Base configuration options for HTTP requests.
 *
 * Contains common settings including timeout, headers, HTTPS agent, and response hooks.
 */
const baseOptions = {
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
  agent: {
    https: agent,
  },
  hooks: {
    afterResponse: [
      /**
       * Response hook that processes successful responses.
       *
       * @param request The original request object.
       * @param options The normalized request options.
       * @param response The response object to process.
       * @returns A new Response object with processed JSON data or the original response.
       */
      async (request: KyRequest, options: NormalizedOptions, response: Response) => {
        if (response.ok) {
          try {
            const text = await response.text()
            const result = text.trim() ? JSON.parse(text) : null
            return new Response(
              result ? JSON.stringify(result) : JSON.stringify(null),
            )
          } catch {
            return new Response(JSON.stringify(null))
          }
        }

        return response
      },
    ],
  },
}

/**
 * Ky instance configured for motion file API requests.
 *
 * Uses the backend host configuration and includes all base options.
 */
export const kyMotionFile = ky.create({
  ...baseOptions,
  prefixUrl: `https://${NEXT_PUBLIC_BACKEND_HOST}:${NEXT_PUBLIC_BACKEND_PORT}${NEXT_PUBLIC_BACKEND_PATH_PREFIX}`,
})

/**
 * Ky instance configured for orchestrator API requests.
 *
 * Uses the orchestrator host configuration, includes all base options,
 * and disables throwing HTTP errors for better error handling.
 */
export const kyOrchestrator = ky.create({
  ...baseOptions,
  prefixUrl: `https://${NEXT_PUBLIC_ORCHESTRATOR_HOST}:${NEXT_PUBLIC_ORCHESTRATOR_PORT}${NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX}`,
  throwHttpErrors: false,
})
