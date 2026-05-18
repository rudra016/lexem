import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getProjectForUser } from "@/lib/authz";
import {
  getDailyUsage,
  getPerVersionUsage,
  getProjectUsageSummary,
} from "@/lib/usage-analytics";
import { UsageChart } from "@/components/usage-chart";

const WINDOW_DAYS = 30;

export default async function ProjectAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const project = await getProjectForUser(user.id, slug);

  const [summary, daily, perVersion] = await Promise.all([
    getProjectUsageSummary(project.id, WINDOW_DAYS),
    getDailyUsage(project.id, WINDOW_DAYS),
    getPerVersionUsage(project.id, WINDOW_DAYS),
  ]);

  const totalTokens = summary.totalTokensIn + summary.totalTokensOut;
  const sources = summary.sourceBreakdown;

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="text-xs text-neutral-500 mb-2">
        <Link href="/dashboard" className="hover:underline">Projects</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${slug}`} className="hover:underline">
          {project.slug}
        </Link>
        <span className="mx-2">/</span>
        <span>analytics</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">Token analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Last {WINDOW_DAYS} days. Counts come from eval runs and from{" "}
          <code className="font-mono">lexem.logUsage()</code> calls in your code.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiTile label="Events" value={summary.totalEvents.toLocaleString()} />
        <KpiTile label="Avg in / call" value={summary.avgTokensIn.toLocaleString()} />
        <KpiTile label="Avg out / call" value={summary.avgTokensOut.toLocaleString()} />
        <KpiTile label="Total tokens" value={totalTokens.toLocaleString()} />
      </div>

      <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] p-5 mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-700">
            Daily tokens
          </h2>
          <div className="text-xs text-neutral-500 flex items-center gap-3">
            <SourceTag label="eval" count={sources.eval} />
            <SourceTag label="sdk" count={sources.sdk} />
            {sources.api > 0 && <SourceTag label="api" count={sources.api} />}
          </div>
        </div>
        <UsageChart points={daily} />
      </div>

      <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
        <div className="flex items-baseline justify-between px-5 py-3 border-b border-black/10">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-700">
            Per version
          </h2>
          <span className="text-xs text-neutral-500">
            sorted by total tokens
          </span>
        </div>
        {perVersion.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-neutral-500">
            No usage recorded yet. Run an eval, or call{" "}
            <code className="font-mono">lexem.logUsage(...)</code> from your app.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-black/10 text-neutral-600">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Prompt</th>
                <th className="text-left px-3 py-2 font-medium">Version</th>
                <th className="text-right px-3 py-2 font-medium">Events</th>
                <th className="text-right px-3 py-2 font-medium">Avg in</th>
                <th className="text-right px-3 py-2 font-medium">Avg out</th>
                <th className="text-right px-5 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {perVersion.map((r, i) => (
                <tr
                  key={r.versionId}
                  className={i > 0 ? "border-t border-black/5" : ""}
                >
                  <td className="px-5 py-2.5">
                    <Link
                      href={`/projects/${slug}/${r.promptSlug}`}
                      className="font-medium hover:underline"
                    >
                      {r.promptName}
                    </Link>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {r.promptSlug}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs text-neutral-700 truncate max-w-[260px]">
                      {r.commitMessage}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {r.branchName} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.events}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {r.avgTokensIn.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {r.avgTokensOut.toLocaleString()}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-medium">
                    {(r.totalTokensIn + r.totalTokensOut).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-black/10 shadow-[3px_3px_0px_#000] px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
    </div>
  );
}

function SourceTag({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono uppercase tracking-widest text-[10px] text-neutral-400">
        {label}
      </span>
      <span className="tabular-nums">{count.toLocaleString()}</span>
    </span>
  );
}
