import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/invite",
  "/docs",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/signup",
  "/api/forgot-password",
  "/api/reset-password",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Landing page — always public. Signed-in users see a "Dashboard" CTA
  // rendered by the page itself instead of being redirected away.
  if (pathname === "/") return;

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
