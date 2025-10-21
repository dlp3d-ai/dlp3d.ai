/**
 * Get the current local time formatted as 'YYYY-MM-DD HH:mm:ss,SSS'.
 *
 * @returns {string} A human-readable timestamp string with millisecond precision.
 */
export function getFormattedTime(): string {
  const now = new Date()

  const pad = (n: number, length = 2) => n.toString().padStart(length, '0')

  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1) // month is starting from 0 by default
  const day = pad(now.getDate())
  const hour = pad(now.getHours())
  const minute = pad(now.getMinutes())
  const second = pad(now.getSeconds())
  const millisecond = pad(now.getMilliseconds(), 3)

  return `${year}-${month}-${day} ${hour}:${minute}:${second},${millisecond}`
}
