import { availableParallelism } from "node:os";
import { z } from "zod";
export const RuntimeSettingsSchema = z.object({
  autopilot: z.boolean(),
  ai_assist: z.boolean().default(false),
  daily_limit: z.number().int().min(1).max(1000),
  execution_mode: z.enum(["balanced", "performance"]).default("balanced"),
  ai_daily_limit: z.number().int().min(0).max(100).default(2),
});
export function packageConcurrency(
  mode: string,
  cpus = availableParallelism(),
) {
  return mode === "performance"
    ? Math.max(1, Math.min(8, Math.floor(cpus / 2)))
    : 1;
}
export function retryDelay(attempt: number) {
  return Math.min(300, 2 ** Math.min(8, Math.max(1, attempt)));
}
export async function runLane(
  work: () => Promise<unknown>,
  signal: AbortSignal,
  intervalMs: number,
  onError: () => void,
) {
  while (!signal.aborted) {
    try {
      await work();
    } catch {
      onError();
    }
    if (signal.aborted) break;
    await new Promise<void>((resolve) => {
      const stop = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", stop);
        resolve();
      };
      const timer = setTimeout(stop, intervalMs);
      signal.addEventListener("abort", stop, { once: true });
    });
  }
}
