import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_LENGTH = 64

export function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}
