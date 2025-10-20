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
      async (request: KyRequest, options: NormalizedOptions, response: Response) => {
        if (!response.ok) {
          // 安全地解析错误响应
          try {
            const result = await response.json()
            throw new Error(result.message || `HTTP ${response.status}`)
          } catch {
            // 如果 JSON 解析失败，使用状态文本
            throw new Error(response.statusText || `HTTP ${response.status}`)
          }
        }

        // 安全地解析成功响应
        try {
          const text = await response.text()
          const result = text.trim() ? JSON.parse(text) : null
          return new Response(result ? JSON.stringify(result) : JSON.stringify(null))
        } catch {
          // 如果解析失败，返回空响应
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
