import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <section className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-medium mb-3">Account</h2>
        <div className="text-sm text-neutral-600 space-y-1">
          <div><span className="text-neutral-500">Name:</span> {user.name ?? "—"}</div>
          <div><span className="text-neutral-500">Email:</span> {user.email}</div>
        </div>
      </section>
    </div>
  );
}
