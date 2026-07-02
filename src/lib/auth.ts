/**
 * Server-side passcode verification.
 * Set ACCESS_PASSCODE in your Vercel environment variables.
 * Change it anytime from the Vercel dashboard — no redeploy needed.
 * If ACCESS_PASSCODE is not set, all requests are allowed (local dev mode).
 */
export function verifyPasscode(code: string | null | undefined): boolean {
  const expected = process.env.ACCESS_PASSCODE
  if (!expected) return true // dev mode — no passcode configured
  if (!code) return false
  return code.trim() === expected.trim()
}

export function unauthorizedResponse() {
  return Response.json(
    { error: 'Access denied. A valid passcode is required to use this tool.' },
    { status: 401 }
  )
}
