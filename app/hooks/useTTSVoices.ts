'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TTS_VOICE_OPTIONS } from '@/constants/index'
import React from 'react' // Added for React.isValidElement
import { env } from 'next-runtime-env'
// Interface definitions for API response types
interface TTSVoicesApiResponse {
  voice_names: Record<string, string> // Actually returns strings, not objects
}

export interface VoiceOption {
  value: string
  label: string
}

interface UseTTSVoicesReturn {
  voiceOptions: VoiceOption[]
  loading: boolean
  error: string | null
  refetch: () => void
}

// Base API URL following existing pattern from TTSAdapterContext
const NEXT_PUBLIC_ORCHESTRATOR_HOST = env('NEXT_PUBLIC_ORCHESTRATOR_HOST')
const NEXT_PUBLIC_ORCHESTRATOR_PORT = env('NEXT_PUBLIC_ORCHESTRATOR_PORT')
const NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX = env(
  'NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX',
)

const API_TIMEOUT = 10000 // 10 second timeout

// Cache for storing voice options by TTS name (session duration)
const voiceCache = new Map<string, VoiceOption[]>()

// Clear cache on module load to prevent stale data issues
voiceCache.clear()

// Utility function to clear voice cache (useful for debugging)
export function clearTTSVoiceCache() {
  voiceCache.clear()
  console.log('TTS voice cache cleared')
}

// Voice label generation utility function
function createVoiceLabel(voiceId: string, displayName: string): string {
  // Ensure we always return a string, never an object
  const voiceName = typeof displayName === 'string' ? displayName : voiceId

  // Safety check - make sure we're not returning an object
  if (typeof voiceName !== 'string') {
    console.error('Voice name is not a string:', voiceName)
    return String(voiceId)
  }

  return voiceName
}

// API call function with proper error handling and timeout
async function fetchTTSVoices(
  ttsName: string,
  signal?: AbortSignal,
): Promise<VoiceOption[]> {
  const url = `https://${NEXT_PUBLIC_ORCHESTRATOR_HOST}:${NEXT_PUBLIC_ORCHESTRATOR_PORT}${NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX}/tts_voice_names/${ttsName}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    // Use provided signal or create timeout controller
    const effectiveSignal = signal || controller.signal

    const response = await fetch(url, {
      method: 'GET',
      signal: effectiveSignal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: TTSVoicesApiResponse = await response.json()

    // Validate response structure
    if (!data.voice_names || typeof data.voice_names !== 'object') {
      throw new Error('Invalid API response structure')
    }

    // Convert API response to voice options
    const voiceOptions: VoiceOption[] = Object.entries(data.voice_names)
      .map(([voiceId, displayName]) => {
        // Safety check - ensure both value and label are strings
        const safeVoiceId = String(voiceId)
        const safeLabel = createVoiceLabel(safeVoiceId, displayName)

        // Final safety check
        if (typeof safeLabel !== 'string') {
          console.error('Invalid label created for voice:', {
            voiceId,
            displayName,
            safeLabel,
          })
          return { value: safeVoiceId, label: safeVoiceId }
        }

        return { value: safeVoiceId, label: safeLabel }
      })
      .filter(
        option =>
          option &&
          typeof option.value === 'string' &&
          typeof option.label === 'string',
      )

    // Return empty array if no voices (will trigger fallback)
    if (voiceOptions.length === 0) {
      throw new Error('No voices returned from API')
    }

    return voiceOptions
  } catch (error) {
    console.error(`Failed to fetch voices for TTS ${ttsName}:`, error)
    throw error
  }
}

// Get fallback options from constants
function getFallbackVoiceOptions(): VoiceOption[] {
  // Use generic default fallback since we rely on API for actual voice options
  const fallbackOptions = TTS_VOICE_OPTIONS['default']
  // Convert readonly array to mutable array to match VoiceOption[] type
  return [...fallbackOptions]
}

// Main hook for managing TTS voices
export function useTTSVoices(ttsName: string): UseTTSVoicesReturn {
  // Initialize with safe fallback options immediately to prevent empty state
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>(() => {
    try {
      const fallback = getFallbackVoiceOptions()
      // Validate fallback options before using them
      const safeFallback = fallback.filter(
        option =>
          option &&
          typeof option === 'object' &&
          typeof option.value === 'string' &&
          typeof option.label === 'string',
      )
      return safeFallback.length > 0
        ? safeFallback
        : [{ value: 'xiaotao', label: 'Default Voice' }]
    } catch (error) {
      console.error('Error initializing voice options:', error)
      return [{ value: 'xiaotao', label: 'Default Voice' }]
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Safe setter for voice options with validation
  const setSafeVoiceOptions = useCallback((options: VoiceOption[]) => {
    try {
      const safeOptions = options.filter(
        option =>
          option &&
          typeof option === 'object' &&
          typeof option.value === 'string' &&
          typeof option.label === 'string' &&
          !React.isValidElement(option.label), // Ensure label is not a React element
      )

      if (safeOptions.length === 0) {
        console.warn('No safe voice options available, using fallback')
        setVoiceOptions([{ value: 'xiaotao', label: 'Default Voice' }])
      } else {
        setVoiceOptions(safeOptions)
      }
    } catch (err) {
      console.error('Error setting voice options:', err)
      setVoiceOptions([{ value: 'xiaotao', label: 'Default Voice' }])
    }
  }, [])

  const fetchVoices = useCallback(
    async (ttsToFetch: string) => {
      // Check cache first
      const cached = voiceCache.get(ttsToFetch)
      if (cached) {
        setSafeVoiceOptions(cached)
        setLoading(false)
        setError(null)
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      setLoading(true)
      setError(null)

      try {
        const voices = await fetchTTSVoices(
          ttsToFetch,
          abortControllerRef.current.signal,
        )

        // Ensure we got valid voice options
        if (!voices || voices.length === 0) {
          throw new Error('No voices returned from API')
        }

        // Cache successful response
        voiceCache.set(ttsToFetch, voices)
        setSafeVoiceOptions(voices)
        setError(null)
      } catch (err: any) {
        // Don't set error if request was aborted (component unmounted or new request started)
        if (err.name === 'AbortError') {
          return
        }

        console.warn(
          `API call failed for TTS ${ttsToFetch}, falling back to constants:`,
          err,
        )

        // Fall back to hardcoded options
        const fallbackOptions = getFallbackVoiceOptions()
        setSafeVoiceOptions(fallbackOptions)
        setError(`Failed to load voices from API, using fallback options`)
      } finally {
        setLoading(false)
      }
    },
    [setSafeVoiceOptions],
  )

  const refetch = useCallback(() => {
    // Clear cache for current TTS and refetch
    voiceCache.delete(ttsName)
    if (ttsName) {
      fetchVoices(ttsName)
    }
  }, [ttsName, fetchVoices])

  // Effect to fetch voices when TTS name changes
  useEffect(() => {
    if (ttsName) {
      fetchVoices(ttsName)
    } else {
      // If no TTS name provided, use default fallback
      setSafeVoiceOptions(getFallbackVoiceOptions())
      setLoading(false)
      setError(null)
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [ttsName, fetchVoices, setSafeVoiceOptions])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    voiceOptions,
    loading,
    error,
    refetch,
  }
}
