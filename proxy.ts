import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import path from "node:path"

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    const token = await getToken({ req: request })
    const isLoggedIn = !!token

    // 1. If logged in and trying to go to /login, redirect to /dashboard
    if (pathname.startsWith("/login") && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
    }

    if (pathname == "/" && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
    }

    // 2. If NOT logged in and trying to access protected routes, redirect to /login
    const isProtectedRoute = pathname === "/" || pathname.startsWith("/dashboard")
    if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", request.nextUrl)
        // Optional: track where they came from
        loginUrl.searchParams.set("callbackUrl", request.url) 
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = { 
    matcher: ['/dashboard/:path*', '/login', '/'] 
}
