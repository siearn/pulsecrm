import { authMiddleware, redirectToSignIn } from "@clerk/nextjs"
import { NextResponse } from "next/server"

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/login",
    "/sign-up",
    "/api/health",
    "/api/webhooks(.*)",
    "/pricing",
    "/features",
    "/about",
    "/contact",
    "/demo",
  ],

  // Routes that can be accessed by authenticated users who don't have a company yet
  ignoredRoutes: ["/api/webhooks(.*)"],

  // Custom logic for handling authentication
  async afterAuth(auth, req) {
    // If the user is authenticated and trying to access a protected route
    if (auth.userId && !auth.isPublicRoute) {
      const url = new URL(req.nextUrl)

      // Check if the user has a company (we'll store this in Clerk user metadata)
      const userHasCompany = auth.sessionClaims?.metadata?.companyId

      // If the user doesn't have a company and is not on the onboarding page, redirect them
      if (!userHasCompany && !url.pathname.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/onboarding", req.url))
      }

      // If the user is trying to access admin routes but is not an admin
      if (url.pathname.startsWith("/admin") && auth.sessionClaims?.metadata?.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }

      // Allow access to the requested page
      return NextResponse.next()
    }

    // If the user is not authenticated and trying to access a protected route
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }

    // Allow access to public routes
    return NextResponse.next()
  },
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}

