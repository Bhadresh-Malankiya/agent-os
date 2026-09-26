export type ModelTask = "brief" | "profile";
export function modelPolicy(task: ModelTask = "brief") {
  const key = task === "profile" ? "CODEX_PROFILE_MODEL" : "CODEX_BRIEF_MODEL";
  const override = process.env[key]?.trim() || process.env.CODEX_MODEL?.trim();
  if (override && !/^[a-zA-Z0-9_.:-]{1,100}$/.test(override))
    throw new Error(
      `Invalid ${key}/CODEX_MODEL configuration; no model was called.`,
    );
  return {
    task,
    model: override || (task === "profile" ? "gpt-6-luna" : "gpt-6-sol"),
    effort: task === "profile" ? "low" : "medium",
    reason:
      task === "profile"
        ? "Exact source extraction with server-side fact validation."
        : "Tailored writing and evidence matching need judgment and completeness.",
  } as const;
}
