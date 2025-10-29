/*
  Get the browser's IANA time zone string.

  @returns string The time zone identifier (e.g., 'Asia/Shanghai').
*/
export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.error('Failed to get timezone:', error)
    return 'Asia/Shanghai'
  }
}

/*
  Get the current timezone offset in minutes relative to UTC.

  @returns number The offset in minutes (UTC-8 => 480, etc.).
*/
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset()
}
