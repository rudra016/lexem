import { prisma, Prisma } from "@lexem/db";

export type UsageSource = "eval" | "sdk" | "api";

export type ProjectUsageSummary = {
  totalEvents: number;
  totalTokensIn: number;
  totalTokensOut: number;
  avgTokensIn: number;
  avgTokensOut: number;
  sourceBreakdown: Record<UsageSource, number>;
};

export type DailyUsagePoint = {
  /** ISO date string (YYYY-MM-DD) bucketed in UTC. */
  date: string;
  tokensIn: number;
  tokensOut: number;
  events: number;
};

export type PromptVersionUsage = {
  promptId: string;
  promptName: string;
  promptSlug: string;
  versionId: string;
  commitMessage: string;
  branchName: string;
  createdAt: string;
  events: number;
  totalTokensIn: number;
  totalTokensOut: number;
  avgTokensIn: number;
  avgTokensOut: number;
};

const SOURCES: UsageSource[] = ["eval", "sdk", "api"];

export async function getProjectUsageSummary(
  projectId: string,
  sinceDays = 30,
): Promise<ProjectUsageSummary> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const [totals, perSource] = await Promise.all([
    prisma.usageEvent.aggregate({
      where: { projectId, createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { tokensIn: true, tokensOut: true },
      _avg: { tokensIn: true, tokensOut: true },
    }),
    prisma.usageEvent.groupBy({
      by: ["source"],
      where: { projectId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const sourceBreakdown: Record<UsageSource, number> = { eval: 0, sdk: 0, api: 0 };
  for (const row of perSource) {
    if ((SOURCES as string[]).includes(row.source)) {
      sourceBreakdown[row.source as UsageSource] = row._count._all;
    }
  }

  return {
    totalEvents: totals._count._all,
    totalTokensIn: totals._sum.tokensIn ?? 0,
    totalTokensOut: totals._sum.tokensOut ?? 0,
    avgTokensIn: Math.round(totals._avg.tokensIn ?? 0),
    avgTokensOut: Math.round(totals._avg.tokensOut ?? 0),
    sourceBreakdown,
  };
}

export async function getDailyUsage(
  projectId: string,
  sinceDays = 30,
): Promise<DailyUsagePoint[]> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<
    { day: Date; tokens_in: bigint; tokens_out: bigint; events: bigint }[]
  >(
    Prisma.sql`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        SUM("tokensIn")::bigint  AS tokens_in,
        SUM("tokensOut")::bigint AS tokens_out,
        COUNT(*)::bigint         AS events
      FROM "UsageEvent"
      WHERE "projectId" = ${projectId}
        AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
  );

  // Fill missing days with zeros so the chart x-axis is continuous.
  const byDay = new Map<string, DailyUsagePoint>();
  for (const r of rows) {
    const iso = r.day.toISOString().slice(0, 10);
    byDay.set(iso, {
      date: iso,
      tokensIn: Number(r.tokens_in),
      tokensOut: Number(r.tokens_out),
      events: Number(r.events),
    });
  }

  const series: DailyUsagePoint[] = [];
  for (let i = sinceDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const iso = d.toISOString().slice(0, 10);
    series.push(
      byDay.get(iso) ?? { date: iso, tokensIn: 0, tokensOut: 0, events: 0 },
    );
  }
  return series;
}

export async function getPerVersionUsage(
  projectId: string,
  sinceDays = 30,
): Promise<PromptVersionUsage[]> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const grouped = await prisma.usageEvent.groupBy({
    by: ["versionId", "promptId"],
    where: { projectId, createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { tokensIn: true, tokensOut: true },
    _avg: { tokensIn: true, tokensOut: true },
  });

  if (grouped.length === 0) return [];

  const versionIds = grouped.map((g) => g.versionId);
  const versions = await prisma.version.findMany({
    where: { id: { in: versionIds } },
    select: {
      id: true,
      commitMessage: true,
      branchName: true,
      createdAt: true,
      prompt: { select: { id: true, name: true, slug: true } },
    },
  });
  const versionLookup = new Map(versions.map((v) => [v.id, v]));

  const rows: PromptVersionUsage[] = grouped
    .map((g) => {
      const v = versionLookup.get(g.versionId);
      if (!v) return null;
      return {
        promptId: v.prompt.id,
        promptName: v.prompt.name,
        promptSlug: v.prompt.slug,
        versionId: v.id,
        commitMessage: v.commitMessage,
        branchName: v.branchName,
        createdAt: v.createdAt.toISOString(),
        events: g._count._all,
        totalTokensIn: g._sum.tokensIn ?? 0,
        totalTokensOut: g._sum.tokensOut ?? 0,
        avgTokensIn: Math.round(g._avg.tokensIn ?? 0),
        avgTokensOut: Math.round(g._avg.tokensOut ?? 0),
      };
    })
    .filter((r): r is PromptVersionUsage => r !== null);

  rows.sort(
    (a, b) => b.totalTokensIn + b.totalTokensOut - (a.totalTokensIn + a.totalTokensOut),
  );
  return rows;
}
