import { withAuth } from "next-auth/middleware"

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
    function middleware(request) {
        const isLoggedIn = !!request.nextauth.token
        const { pathname } = request.nextUrl

        if (pathname.startsWith("/login") && isLoggedIn) {
            return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
        }
    }, {
    pages: {
        signIn: "/login"
    },
    callbacks: {
        authorized: ({ token, req }) => {
            const request = req;
            const { pathname } = request.nextUrl;

            if (pathname == "/login") {
                return true
            }

            return !!token
        }
    }
})



export const config = { matcher: ['/dashboard:path*', '/login', '/'] }