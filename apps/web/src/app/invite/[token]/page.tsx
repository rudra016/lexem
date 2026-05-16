import Link from "next/link";
import { prisma } from "@lexem/db";
import { auth } from "@/auth";
import { ROLE_LABEL } from "@/lib/authz";
import { AcceptInviteButton } from "@/components/accept-invite-button";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  });

  let banner: { tone: "error" | "warn"; message: string } | null = null;
  if (!invite) {
    banner = {
      tone: "error",
      message: "This invite link is invalid or has already been used.",
    };
  } else if (invite.expiresAt < new Date()) {
    banner = { tone: "error", message: "This invite has expired." };
  } else if (
    session?.user?.email &&
    session.user.email.toLowerCase() !== invite.email
  ) {
    banner = {
      tone: "warn",
      message: `This invite is for ${invite.email}. Sign in as that user to accept.`,
    };
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] p-8 w-full max-w-md">
        <h1 className="text-2xl font-black tracking-tight">Team invite</h1>

        {invite ? (
          <p className="text-sm text-neutral-600 mt-2">
            You&apos;ve been invited to join{" "}
            <span className="font-medium">{invite.team.name}</span> as{" "}
            <span className="font-mono">{ROLE_LABEL[invite.role]}</span>.
          </p>
        ) : (
          <p className="text-sm text-neutral-600 mt-2">
            We couldn&apos;t find an invite at this link.
          </p>
        )}

        {banner && (
          <div
            className={`mt-4 px-3 py-2 text-sm border ${
              banner.tone === "error"
                ? "border-red-300 bg-red-50 text-red-800"
                : "border-amber-300 bg-amber-50 text-amber-900"
            }`}
          >
            {banner.message}
          </div>
        )}

        {invite && !banner && (
          <>
            <div className="mt-4 text-xs text-neutral-500 space-y-1">
              <div>
                <span className="text-neutral-400">Email:</span> {invite.email}
              </div>
              <div>
                <span className="text-neutral-400">Expires:</span>{" "}
                {new Date(invite.expiresAt).toLocaleString()}
              </div>
            </div>

            <div className="mt-6">
              {session?.user ? (
                <AcceptInviteButton token={token} />
              ) : (
                <div className="space-y-2">
                  <Link
                    href={`/login?from=/invite/${token}`}
                    className="h-10 px-4 bg-black text-white text-sm font-medium flex items-center justify-center"
                  >
                    Sign in to accept
                  </Link>
                  <Link
                    href={`/signup?from=/invite/${token}`}
                    className="h-10 px-4 border border-black bg-white text-black text-sm font-medium flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                  >
                    Create an account
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-6 text-xs text-neutral-500">
          <Link href="/" className="hover:underline">
            ← Back to Lexem
          </Link>
        </div>
      </div>
    </div>
  );
}
