import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@lexem/db";

const Schema = z.object({
  email: z.string().email(),
});

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function getBaseUrl(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (envUrl) return envUrl;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // No real email transport yet — the client renders the link on screen.
  // For an account that doesn't exist, we deliberately return ok:true with
  // no resetUrl so a typo is visible to the dev tester. Production should
  // swap this for "always return ok, send email out-of-band" + a real mailer.
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true, resetUrl: null });
  }

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${getBaseUrl(req)}/reset-password?token=${rawToken}`;
  return NextResponse.json({ ok: true, resetUrl });
}
