import { ProfileSchema } from "./domain";
export function localReadiness(
  input: {
    profile: unknown;
    heartbeat?: string | Date | null;
    autopilot: boolean;
    aiAssist: boolean;
    aiLimit: number;
    aiAttempts: number;
    sources: number;
  },
  now = Date.now(),
) {
  const alive =
    !!input.heartbeat && now - new Date(input.heartbeat).getTime() < 20000;
  return [
    {
      id: "profile",
      label: "Your profile",
      state: ProfileSchema.safeParse(input.profile).success
        ? "ready"
        : "action",
      detail: ProfileSchema.safeParse(input.profile).success
        ? "Saved facts are available."
        : "Paste and accept a profile in Library.",
    },
    {
      id: "worker",
      label: "Background worker",
      state: alive ? "ready" : "action",
      detail: alive
        ? "Heartbeat received. Docker and an awake computer are required."
        : "Worker heartbeat is missing or stale. Start the worker.",
    },
    {
      id: "mode",
      label: "Automatic preparation",
      state: input.autopilot ? "ready" : "paused",
      detail: input.autopilot
        ? "New eligible leads are prepared automatically."
        : "Paused by the owner; saved work is retained.",
    },
    {
      id: "sources",
      label: "Opportunity sources",
      state: input.sources ? "ready" : "action",
      detail: input.sources
        ? `${input.sources} enabled boards; locations and eligibility still need review.`
        : "Add a public board in Leads.",
    },
    {
      id: "ai",
      label: "AI writing budget",
      state: !input.aiAssist
        ? "optional"
        : input.aiAttempts >= input.aiLimit
          ? "limited"
          : "ready",
      detail: !input.aiAssist
        ? "Automatic briefs are off. Profile parsing still requires a Codex login and allowance."
        : `${input.aiAttempts} of ${input.aiLimit} daily attempts used. Login and provider allowance are checked when a task runs.`,
    },
    {
      id: "browser",
      label: "Browser applications",
      state: "unavailable",
      detail:
        "Automatic form submission is not implemented. No browser-cloud subscription is needed for this release.",
    },
  ];
}
