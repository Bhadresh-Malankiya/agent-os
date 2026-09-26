import { modelPolicy } from "./model-policy";
import { execFile, spawn } from "node:child_process";
export function loginMethod(text: string, ok: boolean) {
  if (!ok) return "unavailable";
  if (/logged in using chatgpt/i.test(text)) return "chatgpt";
  if (/logged in using an? api key|logged in using api key/i.test(text))
    return "api-key";
  return "unknown";
}
export function configuredModel() {
  const value = process.env.CODEX_MODEL;
  return value && /^[a-zA-Z0-9_.:-]{1,100}$/.test(value) ? value : null;
}
let cached:
  | {
      expires: number;
      key: string;
      value: Promise<ReturnType<typeof describeAI>>;
    }
  | undefined;
export function describeAI(authMode: string) {
  return {
    provider: "OpenAI",
    runtime: "Codex CLI",
    authMode,
    billing:
      authMode === "chatgpt"
        ? "ChatGPT account allowance / credits"
        : authMode === "api-key"
          ? "OpenAI API usage-based billing"
          : "Billing method could not be verified",
    subscription:
      "Exact plan name could not be read. Remaining allowance is not included in app token totals.",
    requestedModel: modelPolicy().model,
    policies: [modelPolicy("brief"), modelPolicy("profile")],
    model: `Briefs: ${modelPolicy("brief").model} (${modelPolicy("brief").effort}); résumé: ${modelPolicy("profile").model} (${modelPolicy("profile").effort})`,
    checkedAt: new Date().toISOString(),
  };
}
export function aiRuntimeInfo() {
  const bin = process.env.CODEX_BIN ?? "codex";
  const key =
    bin + "|" + JSON.stringify([modelPolicy("brief"), modelPolicy("profile")]);
  if (cached && cached.key === key && cached.expires > Date.now())
    return cached.value;
  const value = new Promise<ReturnType<typeof describeAI>>((resolve) => {
    execFile(
      /* turbopackIgnore: true */ bin,
      ["login", "status"],
      {
        timeout: 5000,
        maxBuffer: 8192,
        env: {
          NODE_ENV: "production",
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          CODEX_HOME: process.env.CODEX_HOME,
        },
      },
      async (error, stdout, stderr) => {
        const info = describeAI(loginMethod(stdout + "\n" + stderr, !error));
        const plan = info.authMode === "chatgpt" ? await readPlan(bin) : null;
        if (plan)
          info.subscription =
            "ChatGPT " +
            plan +
            " — reported by the local Codex account. Account allowance is shared with your other Codex usage.";
        resolve(info);
      },
    );
  });
  cached = { key, expires: Date.now() + 300000, value };
  return value;
}

export function safePlan(account: unknown): string | null {
  const a = account as { type?: string; planType?: string } | null;
  return a?.type === "chatgpt" &&
    typeof a.planType === "string" &&
    /^[a-zA-Z0-9 _-]{1,50}$/.test(a.planType)
    ? a.planType
    : null;
}
function readPlan(bin: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(
      /* turbopackIgnore: true */ bin,
      [
        "app-server",
        "--disable",
        "apps",
        "--disable",
        "plugins",
        "--disable",
        "hooks",
        "--disable",
        "shell_tool",
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          NODE_ENV: "production",
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          CODEX_HOME: process.env.CODEX_HOME,
        },
      },
    );
    let buffer = "",
      size = 0,
      done = false;
    const finish = (plan: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      resolve(plan);
    };
    const timer = setTimeout(() => finish(null), 6000);
    child.on("error", () => finish(null));
    child.on("close", () => finish(null));
    child.stdin.on("error", () => finish(null));
    child.stderr.on("data", () => {});
    const send = (v: unknown) => {
      if (!done) child.stdin.write(JSON.stringify(v) + "\n");
    };
    child.stdout.on("data", (chunk) => {
      size += chunk.length;
      if (size > 100000) return finish(null);
      buffer += chunk.toString();
      let n;
      while ((n = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, n);
        buffer = buffer.slice(n + 1);
        try {
          const msg = JSON.parse(line);
          if (msg.id === 1) {
            if (msg.error) return finish(null);
            send({ method: "initialized", params: {} });
            send({
              method: "account/read",
              id: 2,
              params: { refreshToken: false },
            });
          }
          if (msg.id === 2) finish(safePlan(msg.result?.account));
        } catch {}
      }
    });
    send({
      method: "initialize",
      id: 1,
      params: { clientInfo: { name: "agent_os_usage", version: "0.2.0" } },
    });
  });
}
