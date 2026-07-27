import { randomUUID } from 'crypto'

const FINGERPRINT_COOKIE = 'tk_fp'
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365

function isValidFingerprint(value) {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value)
}

/**
 * Assigns a stable per-browser fingerprint cookie used for rate limiting.
 * Falls back to IP on the first request before the cookie is set.
 */
export function ensureFingerprint(req, res, next) {
  const existing = req.cookies?.[FINGERPRINT_COOKIE]

  if (isValidFingerprint(existing)) {
    req.fingerprintId = existing
    return next()
  }

  const fingerprintId = randomUUID()
  req.fingerprintId = fingerprintId

  res.cookie(FINGERPRINT_COOKIE, fingerprintId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'PRODUCTION',
    maxAge: ONE_YEAR_MS,
  })

  return next()
}
