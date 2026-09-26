import { IntegrationSetupError } from "./integration-policy";
export function connectionDiagnostic(error: unknown, stage: string) {
  type ProviderError = {
    status?: number;
    statusCode?: number;
    name?: string;
    code?: string;
    cause?: ProviderError;
  };
  const outer = error as ProviderError | null;
  const chain = [outer, outer?.cause, outer?.cause?.cause];
  const rawStatus = chain
    .map((e) => e?.status ?? e?.statusCode)
    .find((v) => Number.isInteger(v) && v! >= 400 && v! <= 599);
  const status = rawStatus;
  const e =
    chain.find((v) => v?.name === "TimeoutError" || v?.name === "AbortError") ??
    outer;
  const code = chain
    .map((v) => v?.code)
    .find((c) =>
      [
        "ENOTFOUND",
        "EAI_AGAIN",
        "ECONNREFUSED",
        "ECONNRESET",
        "ETIMEDOUT",
      ].includes(c ?? ""),
    );
  let reason =
    "Provider returned an unclassified error. Its raw response is withheld because it may contain credentials.";
  let recovery =
    "Check the provider dashboard and retry the connection check. Do not repeatedly create authorization links.";
  let category = "UNKNOWN_PROVIDER_ERROR",
    retryable = false;
  if (error instanceof IntegrationSetupError) {
    category = "CONFIGURATION";
    reason = error.message;
    recovery = "Correct the indicated configuration, then retry.";
  } else if (status === 401) {
    category = "INVALID_API_KEY";
    reason = "Composio rejected authentication (HTTP 401).";
    recovery =
      "Replace the Composio key in the private environment and restart the app.";
  } else if (status === 403) {
    category = "PROVIDER_FORBIDDEN";
    reason = "The provider denied this request (HTTP 403).";
    recovery =
      "Check project permissions, OAuth scopes and provider application approval.";
  } else if (status === 404) {
    category = "CONFIG_NOT_FOUND";
    reason = "The requested provider resource was not found (HTTP 404).";
    recovery =
      "Verify that the auth configuration belongs to this Composio project.";
  } else if (status === 429) {
    category = "RATE_LIMITED";
    reason = "Provider rate limit reached (HTTP 429).";
    recovery = "Wait before retrying. Existing connections are unchanged.";
    retryable = true;
  } else if (status && status >= 500) {
    category = "PROVIDER_UNAVAILABLE";
    reason = `Provider service failed (HTTP ${status}).`;
    recovery = "Retry the access check after the provider recovers.";
    retryable = true;
  } else if (
    e?.name === "TimeoutError" ||
    e?.name === "AbortError" ||
    code === "ETIMEDOUT"
  ) {
    category = "TIMEOUT";
    reason = "Provider request exceeded its time limit.";
    recovery =
      "Check connectivity, then check access before starting another connection.";
    retryable = true;
  } else if (
    ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET"].includes(
      code ?? "",
    )
  ) {
    category = code!;
    reason = `Network connection failed (${code}).`;
    recovery = "Check internet/DNS connectivity and retry the access check.";
    retryable = true;
  }
  return {
    stage,
    code: category,
    httpStatus: status ?? null,
    message: reason,
    recovery,
    retryable,
    checkedAt: new Date().toISOString(),
  };
}
export function callbackDiagnostic(params: URLSearchParams) {
  const code = params.get("error");
  if (code === "access_denied")
    return "Provider reported access_denied. Consent was declined or blocked; check the provider screen and application approval.";
  if (code === "redirect_uri_mismatch")
    return "Provider reported redirect_uri_mismatch. Correct the OAuth redirect address in the provider configuration.";
  if (
    code ||
    ["failed", "error", "failure"].includes(params.get("status") ?? "")
  )
    return "Provider reported an unsuccessful authorization. Check access and the provider dashboard for its reason.";
  return "Authorization returned without verified access. Consent may be unfinished or blocked. If Google displayed “This app is blocked”, its OAuth application needs approval or a correctly configured custom OAuth app. The provider did not return that browser message to this app.";
}
