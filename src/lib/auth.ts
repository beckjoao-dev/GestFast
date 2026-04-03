import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const JWT_SECRET  = process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production'
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN ?? '8h'

export const COOKIE_NAME   = 'gf_session_v2'
const LEGACY_COOKIES        = ['gestfast_token']

export interface JWTPayload {
  userId: string
  email:  string
  role:   'ADMIN' | 'USER'
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    if (!decoded?.userId || !decoded?.role) return null
    return decoded
  } catch {
    return null
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/** Usada em Route Handlers — seta cookie na NextResponse */
export function makeAuthResponse(data: object, token: string, status = 200): NextResponse {
  const res = NextResponse.json({ success: true, data }, { status })
  LEGACY_COOKIES.forEach(n => res.cookies.delete(n))
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
  })
  return res
}

export function makeClearCookieResponse(data: object): NextResponse {
  const res = NextResponse.json({ success: true, data })
  res.cookies.delete(COOKIE_NAME)
  LEGACY_COOKIES.forEach(n => res.cookies.delete(n))
  return res
}

/**
 * Usada em Server Components e Route Handlers (Node.js runtime).
 * NÃO usar no middleware (Edge runtime).
 */
export function getCurrentUser(): JWTPayload | null {
  try {
    const store = cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export function requireAuth(): JWTPayload {
  const user = getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export function requireAdmin(): JWTPayload {
  const user = getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  if (user.role !== 'ADMIN') throw new Error('FORBIDDEN')
  return user
}
