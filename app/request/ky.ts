import ky from 'ky'
import type { KyRequest, NormalizedOptions } from 'ky'
import https from 'https'
import { env } from 'next-runtime-env'

const NEXT_PUBLIC_BACKEND_HOST = env('NEXT_PUBLIC_BACKEND_HOST')
const NEXT_PUBLIC_BACKEND_PORT = env('NEXT_PUBLIC_BACKEND_PORT')
const NEXT_PUBLIC_BACKEND_PATH_PREFIX = env('NEXT_PUBLIC_BACKEND_PATH_PREFIX')
const NEXT_PUBLIC_ORCHESTRATOR_HOST = env('NEXT_PUBLIC_ORCHESTRATOR_HOST')
const NEXT_PUBLIC_ORCHESTRATOR_PORT = env('NEXT_PUBLIC_ORCHESTRATOR_PORT')
const NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX = env(
  'NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX',
)

const agent = new https.Agent({
  rejectUnauthorized: false,
})

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
      /*
        Normalize responses and errors for all requests.

        @param request KyRequest - The original request.
        @param options NormalizedOptions - The normalized request options.
        @param response Response - The fetch response to process.

        @returns Promise<Response> A sanitized Response object with JSON body or an empty JSON.

        @throws {Error} When the response is not ok; error message is extracted from the body if available.
      */
      async (request: KyRequest, options: NormalizedOptions, response: Response) => {
        if (!response.ok) {
          // Safely parse error response
          let message: string
          try {
            const result = await response.json()
            message =
              result.detail?.error || result.message || `HTTP ${response.status}`
          } catch {
            message = response.statusText || `HTTP ${response.status}`
          }
          throw new Error(message)
        }

        // Safely parse successful response
        try {
          const text = await response.text()
          const result = text.trim() ? JSON.parse(text) : null
          return new Response(result ? JSON.stringify(result) : JSON.stringify(null))
        } catch {
          // If parsing fails, return an empty JSON response
          return new Response(JSON.stringify(null))
        }
      },
    ],
  },
}

export const kyDlpApi = ky.create({
  ...baseOptions,
  prefixUrl: `https://${NEXT_PUBLIC_BACKEND_HOST}:${NEXT_PUBLIC_BACKEND_PORT}${NEXT_PUBLIC_BACKEND_PATH_PREFIX}`,
})
export const kyDlpConfig = ky.create({
  ...baseOptions,
  prefixUrl: `https://${NEXT_PUBLIC_ORCHESTRATOR_HOST}:${NEXT_PUBLIC_ORCHESTRATOR_PORT}${NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX}`,
})
