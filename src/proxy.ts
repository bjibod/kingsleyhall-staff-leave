import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/forgot-password"];
export function proxy(request: NextRequest) {
  if (publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) return NextResponse.next();
  if (!request.cookies.get("kh_leave_session")) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*", "/leave/:path*", "/calendar/:path*", "/profile/:path*", "/manager/:path*", "/admin/:path*"] };
