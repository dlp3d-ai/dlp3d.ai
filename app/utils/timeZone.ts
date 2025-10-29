/**
 * 获取浏览器的时区
 * @returns 返回时区字符串，例如 'Asia/Shanghai'
 */
export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.error('Failed to get timezone:', error)
    return 'Asia/Shanghai'
  }
}

/**
 * 获取时区偏移量（分钟）
 * @returns 相对于 UTC 的分钟数
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset()
}
