import { getBrowserTimeZone } from '@/utils/timeZone'
import { env } from 'next-runtime-env'

/*
  Determine whether the user's location is within Mainland China or Hong Kong.

  Priority: use cached geolocation from localStorage key 'dlp_user_location'. If unavailable or invalid,
  fall back to checking the browser time zone.

  @returns boolean True if the user is in Mainland China or Hong Kong, otherwise false.
*/
export const checkLocation = () => {
  const isValidNumber = (value: unknown) =>
    typeof value === 'number' && isFinite(value)

  const isInMainlandChinaOrHongKong = (lat: number, lon: number) => {
    // Rough bounding box for Mainland China
    const inMainland = lat >= 18 && lat <= 54 && lon >= 73 && lon <= 135
    // Tighter bounding box for Hong Kong
    const inHongKong = lat >= 22.14 && lat <= 22.57 && lon >= 113.76 && lon <= 114.41
    return inMainland || inHongKong
  }

  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('dlp_user_location')
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            latitude?: unknown
            longitude?: unknown
          }
          const lat = parsed?.latitude as number | undefined
          const lon = parsed?.longitude as number | undefined
          if (isValidNumber(lat) && isValidNumber(lon)) {
            return isInMainlandChinaOrHongKong(lat as number, lon as number)
          }
        } catch {
          // ignore malformed cache
        }
      } else {
        // Fallback: check timezone when location is empty or invalid
        const tz = getBrowserTimeZone()

        return (
          tz === 'Asia/Shanghai' || tz === 'Asia/Urumqi' || tz === 'Asia/Hong_Kong'
        )
      }
    }
  } catch {
    // ignore unexpected errors and fall through to default
  }

  return false
}

/*
  Determine whether the orchestrator host indicates a Sensetime deployment.

  @returns boolean True if the env NEXT_PUBLIC_ORCHESTRATOR_HOST contains 'sensetime'.
*/
export const isSensetimeOrchestrator = () => {
  const NEXT_PUBLIC_ORCHESTRATOR_HOST = env('NEXT_PUBLIC_ORCHESTRATOR_HOST')!
  return NEXT_PUBLIC_ORCHESTRATOR_HOST.includes('sensetime')
}
