import { createHash } from 'crypto'

/**
 * Convert a string to its MD5 hash.
 *
 * The input is encoded as UTF-8 and hashed using the MD5 algorithm, then
 * returned as a lowercase hexadecimal string.
 *
 * @param inputStr The input string to hash.
 *
 * @returns The lowercase hexadecimal MD5 hash.
 */
export function strToMd5(inputStr: string): string {
  return createHash('md5').update(inputStr, 'utf8').digest('hex')
}
