import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/signup", "/api/auth", "/api/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Landing page — public for guests, dashboard for signed-in users.
  if (pathname === "/") {
    if (req.auth) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
    return;
  }

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return;

  if (!req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
