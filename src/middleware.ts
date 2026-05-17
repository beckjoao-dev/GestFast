import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'gf_session_v2'

// Rotas públicas — sem autenticação
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/api/auth/login',
  '/api/health',
]

function decodeJWT(token: string): { userId: string; role: string } | null {
  try {
    const parts  = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded  = base64 + '=='.slice(0, (4 - base64.length % 4) % 4)
    const payload = JSON.parse(atob(padded))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    if (!payload.userId || !payload.role) return null
    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Assets — passa direto
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token    = req.cookies.get(COOKIE_NAME)?.value
  const session  = token ? decodeJWT(token) : null
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Logado tentando acessar landing/login → dashboard
  if (session && (pathname === '/' || pathname.startsWith('/login'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Não logado em rota protegida
  if (!session && !isPublic) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // /admin e /api/admin — somente ADMIN
  if (session && (pathname.startsWith('/admin') || pathname.startsWith('/api/admin'))) {
    if (session.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
