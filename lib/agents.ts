export type RunEvidence = {
  kind: string;
  completed: number;
  failed: number;
  retried: number;
  today: number;
  active: number;
  recent_failures?: number;
};
export function executionMaturity(
  completed: number,
  failed: number,
  retried = 0,
) {
  const clean = failed === 0 && retried === 0;
  const level = clean && completed >= 20 ? 2 : completed > 0 ? 1 : 0;
  return {
    level,
    label: ["Unproven", "Observed", "Consistent"][level],
    progress: Math.min(20, Math.max(0, completed)),
    target: 20,
    next:
      level === 2
        ? "20 recent tasks completed without a failed or retried run."
        : !clean
          ? "Recent failures or retries need review before advancing."
          : `${Math.max(0, 20 - completed)} more clean completions to reach Consistent.`,
  };
}
export function agentOverview({
  settings,
  health,
  evidence,
  sources,
  now = Date.now(),
}: {
  settings: {
    autopilot: boolean;
    ai_assist: boolean;
    daily_limit: number;
    ai_daily_limit: number;
  };
  health: { heartbeat: string | Date } | null;
  evidence: RunEvidence[];
  sources: {
    enabled: boolean;
    last_sync: string | Date | null;
    sync_error: string | null;
  }[];
  now?: number;
}) {
  const alive = !!health && now - new Date(health.heartbeat).getTime() < 20000;
  const base = !alive ? "Offline" : !settings.autopilot ? "Paused" : null;
  const activeSources = sources.filter((s) => s.enabled);
  const fresh = activeSources.filter(
    (s) =>
      s.last_sync &&
      !s.sync_error &&
      now - new Date(s.last_sync).getTime() < 7 * 3600000,
  );
  const sourceIssues = activeSources.some(
    (s) =>
      s.sync_error ||
      (s.last_sync && now - new Date(s.last_sync).getTime() >= 7 * 3600000),
  );
  return [
    {
      id: "research",
      name: "Scout",
      purpose: "Checks your connected job boards every six hours.",
      status:
        base ??
        (!activeSources.length
          ? "Needs setup"
          : sourceIssues
            ? "Needs attention"
            : "Monitoring"),
      level: fresh.length ? 1 : 0,
      label: fresh.length ? "Observed" : "Unproven",
      progress: fresh.length,
      target: activeSources.length || 1,
      detail: `${fresh.length} of ${activeSources.length} enabled sources checked successfully in the last seven hours.`,
      next: "Source checks show coverage, not hiring quality. Higher maturity needs historical source evaluations.",
      destination: "connections",
    },
    ...(["package", "ai-brief"] as const).map((kind) => {
      const row = evidence.find((e) => e.kind === kind) ?? {
        kind,
        completed: 0,
        failed: 0,
        retried: 0,
        today: 0,
        active: 0,
      };
      const ai = kind === "ai-brief";
      const cap = ai ? settings.ai_daily_limit : settings.daily_limit;
      return {
        id: kind,
        name: ai ? "Analyst" : "Preparer",
        purpose: ai
          ? "Writes evidence-linked AI briefs and raises questions."
          : "Matches your skills and prepares application drafts.",
        status:
          base ??
          (ai && !settings.ai_assist
            ? "Disabled"
            : row.active
              ? "Working"
              : ai && (row.recent_failures ?? 0) >= 3
                ? "Cooling down"
                : row.today >= cap
                  ? "Daily limit"
                  : row.failed
                    ? "Needs attention"
                    : "Ready"),
        ...executionMaturity(row.completed, row.failed, row.retried),
        detail: `${row.completed} completed · ${row.failed} failed · ${row.retried} retried. Latest 20 real runs within 30 days.`,
        destination: "activity",
      };
    }),
  ];
}
