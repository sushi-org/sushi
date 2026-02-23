import { auth } from "@/auth";
import { NextResponse } from "next/server";

const SUPER_ADMIN_EMAIL = "lamtomoki@gmail.com";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAuthenticated = !!session?.user;
  const pathname = nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated || session.user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  if (isAuthenticated && pathname.startsWith("/dashboard") && !session.companyId) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl.origin));
  }

  if (isAuthenticated && pathname.startsWith("/onboarding") && session.companyId) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/admin/:path*"],
};
