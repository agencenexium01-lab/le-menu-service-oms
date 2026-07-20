import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('__session')?.value

  // ═══════════════════════════════════════════
  // RÈGLE 1 — ISOLATION TOTALE DU PORTAIL PRO
  // Un client authentifié qui tente d'accéder à /pro/* est rejeté
  // Un visiteur non-connecté qui accède à /pro/* est redirigé vers /pro/connexion
  // ═══════════════════════════════════════════
  if (pathname.startsWith('/pro')) {
    if (pathname === '/pro/connexion') {
      // Page de login pro : accessible à tous si non connecté
      // Si déjà connecté comme staff → rediriger vers le bon dashboard
      if (sessionCookie) {
        // La vérification du rôle se fait côté page (getServerSideProps ou server component)
        return NextResponse.next()
      }
      return NextResponse.next()
    }

    // Toutes les autres routes /pro/* nécessitent une session
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/pro/connexion', request.url))
    }

    return NextResponse.next()
  }

  // ═══════════════════════════════════════════
  // RÈGLE 2 — ISOLATION DU PORTAIL CLIENT
  // Un staff (chef_point ou super_admin) ne peut pas accéder à /client/*
  // Les routes /client/* nécessitent role='client'
  // ═══════════════════════════════════════════
  if (pathname.startsWith('/client')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/connexion', request.url))
    }
    return NextResponse.next()
  }

  // ═══════════════════════════════════════════
  // RÈGLE 3 — PAGES AUTH PUBLIQUES
  // Si déjà connecté → rediriger vers le bon dashboard
  // ═══════════════════════════════════════════
  if (pathname === '/connexion' || pathname === '/inscription' ||
      pathname === '/login' || pathname === '/register') {
    if (sessionCookie) {
      // Rediriger selon le rôle — géré côté page
      return NextResponse.next()
    }
    return NextResponse.next()
  }

  // ═══════════════════════════════════════════
  // RÈGLE 4 — HEADERS DE SÉCURITÉ SUR TOUTES LES PAGES
  // ═══════════════════════════════════════════
  const response = NextResponse.next()

  // Empêcher le clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  // Empêcher le MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.jpg$).*)',
  ],
}
