import { NextResponse, type NextRequest } from "next/server";

// Protect these paths (adjust as needed)
const PROTECTED = ["/admin"];

function isProtectedPath(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Skip non-protected paths
  if (!isProtectedPath(pathname)) return NextResponse.next();

  // ✅ Edge-safe auth gate: check for Supabase session cookies
  // Supabase commonly sets one of these depending on setup:
  // - sb-access-token / sb-refresh-token
  // - sb-<project-ref>-auth-token (newer)
  const hasSessionCookie =
    req.cookies.get("sb-access-token")?.value ||
    req.cookies.get("sb-refresh-token")?.value ||
    // fallback: any cookie that starts with "sb-" and includes "auth-token"
    req.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (!hasSessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login"; // or "/admin/login" depending on your app
    url.searchParams.set("redirectTo", pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
