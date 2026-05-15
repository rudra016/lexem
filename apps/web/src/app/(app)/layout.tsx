import { requireUser, getUserTeams } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { cookies } from "next/headers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const teams = await getUserTeams(user.id);
  const collapsed = (await cookies()).get("sb_collapsed")?.value === "1";

  return (
    <div className="h-screen flex bg-neutral-50 overflow-hidden">
      <Sidebar user={user} teams={teams} initialCollapsed={collapsed} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
