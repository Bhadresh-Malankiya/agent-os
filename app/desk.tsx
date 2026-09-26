"use client";
import { callbackDiagnostic } from "@/lib/connection-diagnostics";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Plus,
  Pause,
  Play,
  Search,
  FileText,
  Layers,
  Activity,
  ShieldCheck,
  Settings,
  RefreshCw,
  Mail,
  Calendar,
  BookOpen,
  ChevronRight,
  X,
} from "lucide-react";
import { draftMessage } from "@/lib/text";
type Row = Record<string, any>;
const tabs = ["Today", "Leads", "Work", "Library", "Activity"];
export default function Desk() {
  const [data, setData] = useState<Row | null>(null),
    [tab, setTab] = useState("Today"),
    [connectionIssue, setConnectionIssue] = useState<Row | null>(null),
    [section, setSection] = useState("Profile"),
    [setup, setSetup] = useState(false),
    [caps, setCaps] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [preview, setPreview] = useState<Row | null>(null),
    [raw, setRaw] = useState(""),
    [showSamples, setShowSamples] = useState(false),
    [workKind, setWorkKind] = useState("email"),
    [workSeed, setWorkSeed] = useState<Row>({}),
    [showDraft, setShowDraft] = useState<Row | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (showDraft) dialog.current?.showModal();
    else dialog.current?.close();
  }, [showDraft]);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (!r.ok)
        throw new Error(
          "Workspace unavailable. Check that Docker and the worker are running.",
        );
      setData(await r.json());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  const checkAccess = useCallback(async () => {
    try {
      const r = await fetch("/api/integrations", {
        signal: AbortSignal.timeout(15000),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setCaps(v);
      return v;
    } catch (e) {
      setCaps({
        outreach: false,
        calendar: false,
        error: (e as Error).message,
      });
    }
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returned = params.has("connection");
    const pending = sessionStorage.getItem("agent-os-connection");
    if (returned || pending) {
      setSetup(true);
      sessionStorage.removeItem("agent-os-connection");
      if (returned)
        window.history.replaceState({}, "", window.location.pathname);
      checkAccess().then((v) => {
        if (
          !v?.[pending === "outreach" || pending === "calendar" ? pending : ""]
        )
          setConnectionIssue({
            stage: "Authorization return",
            code: "ACCESS_NOT_VERIFIED",
            message: callbackDiagnostic(params),
            recovery:
              "Check access again or review the provider OAuth configuration.",
          });
        setNotice(
          v?.[pending === "outreach" || pending === "calendar" ? pending : ""]
            ? "Account connected. Access was verified with the provider. Choose your working mode below."
            : "Returned from account connection. Access is not confirmed yet; check the status below or retry.",
        );
      });
    }
    const onReturn = () => {
      if (sessionStorage.getItem("agent-os-connection")) {
        setSetup(true);
        sessionStorage.removeItem("agent-os-connection");
        checkAccess().then((v) => {
          if (!v?.outreach && !v?.calendar)
            setConnectionIssue({
              stage: "Authorization return",
              code: "ACCESS_NOT_VERIFIED",
              message: callbackDiagnostic(new URLSearchParams()),
              recovery:
                "Review the provider screen or custom OAuth configuration, then check access.",
            });
        });
      }
    };
    window.addEventListener("pageshow", onReturn);
    return () => window.removeEventListener("pageshow", onReturn);
  }, [checkAccess]);
  useEffect(() => {
    refresh();
    checkAccess();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh, checkAccess]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  async function send(action: Row, legacy = false) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(legacy ? "/api/control" : "/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      await refresh();
      return v;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function connect(toolkit: string) {
    setBusy(true);
    setError("");
    setConnectionIssue(null);
    try {
      const r = await fetch("/api/integrations", {
        signal: AbortSignal.timeout(40000),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit }),
      });
      const v = await r.json();
      if (!r.ok) {
        setConnectionIssue(
          v.diagnostic ?? {
            stage: "Connect",
            code: "REQUEST_FAILED",
            message: v.error,
          },
        );
        throw new Error(v.error);
      }
      sessionStorage.setItem("agent-os-connection", toolkit);
      window.location.assign(v.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const alive =
    !!data?.health &&
    Date.now() - new Date(data.health.heartbeat).getTime() < 20000;
  const blockers =
    data?.decisions.filter((d: Row) =>
      ["open", "blocked"].includes(d.status),
    ) ?? [];
  const holds =
    data?.work.filter((w: Row) =>
      ["draft", "blocked", "unknown"].includes(w.status),
    ) ?? [];
  const leads =
    data?.opportunities.filter(
      (o: Row) =>
        (showSamples || !o.sample) &&
        `${o.title} ${o.company} ${o.country}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ) ?? [];
  const upcoming =
    data?.work.filter(
      (w: Row) =>
        w.kind === "meeting" &&
        w.status === "scheduled" &&
        new Date(w.due_at).getTime() > Date.now(),
    ) ?? [];
  const gate = !!data && (!data.settings.access_confirmed || setup);
  const profileReady = !!data?.settings.profile.name;
  const feedback = (text: string) => setNotice(text);
  function goProfile() {
    setTab("Library");
    setSection("Profile");
  }
  function messages() {
    return (
      <>
        {error && (
          <div role="alert" className="desk-alert">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <div role="status" className="desk-notice">
            {notice}
          </div>
        )}
      </>
    );
  }
  return (
    <div className="os-shell">
      <header className="os-header">
        <a href="/" className="os-logo">
          <Layers size={22} />
          agent<span>os</span>
        </a>
        <span className="os-caption">Your outreach workspace</span>
        <button
          className="os-access"
          onClick={() => {
            setSetup(true);
            checkAccess();
          }}
        >
          <ShieldCheck size={15} />
          Access & setup
        </button>
      </header>
      {!data ? (
        <main className="os-setup">
          {messages()}
          <h1>Opening your workspace</h1>
          <button onClick={refresh}>
            <RefreshCw size={16} />
            Try again
          </button>
        </main>
      ) : gate ? (
        <main className="os-setup">
          <div className="os-step">01 / ACCESS FIRST</div>
          <h1>
            Connect what you want
            <br />
            your agents to do.
          </h1>
          <p>
            Connect redirects you to the provider. After consent, you return
            here and the app verifies access.
          </p>
          {messages()}
          <div className="access-grid">
            <section className="os-card">
              <div className="os-card-heading">
                <Mail />
                <span className={`tag ${caps?.outreach ? "good" : ""}`}>
                  {caps?.outreach ? "Connected" : "Not connected"}
                </span>
              </div>
              <h2>Email outreach</h2>
              <p>
                Read replies and send only the exact messages you approve. A
                read-only Gmail connection cannot send.
              </p>
              <button disabled={busy} onClick={() => connect("outreach")}>
                Connect Gmail <ArrowUpRight size={14} />
              </button>
            </section>
            <section className="os-card">
              <div className="os-card-heading">
                <Calendar />
                <span className={`tag ${caps?.calendar ? "good" : ""}`}>
                  {caps?.calendar ? "Connected" : "Optional"}
                </span>
              </div>
              <h2>Calendar</h2>
              <p>
                Check availability and create approved meeting invitations.
                Invitations are not attendee confirmations.
              </p>
              <button disabled={busy} onClick={() => connect("calendar")}>
                Connect Calendar <ArrowUpRight size={14} />
              </button>
            </section>
          </div>
          {caps?.details && (
            <div className="os-card">
              <p>{caps.details.outreach}</p>
              <p>{caps.details.calendar}</p>
              <small>
                Checked {new Date(caps.checkedAt).toLocaleTimeString()}
              </small>
            </div>
          )}
          {[
            ...(caps?.diagnostics ?? []),
            ...(connectionIssue ? [connectionIssue] : []),
          ].map((issue: Row, i: number) => (
            <section className="os-card" role="alert" key={i}>
              <h3>{issue.stage}</h3>
              <p>{issue.message}</p>
              <p>{issue.recovery}</p>
              <small>
                {issue.code}
                {issue.httpStatus ? ` · HTTP ${issue.httpStatus}` : ""}
                {issue.reference ? ` · Reference ${issue.reference}` : ""}
              </small>
            </section>
          ))}
          <details className="os-card">
            <summary>Google blocked the connection?</summary>
            <p>
              Use your own Google OAuth application through a Composio auth
              configuration. This does not bypass Google's approval
              requirements. Add its configuration ID here after setting the
              required scopes.
            </p>
            <p>
              <a
                href="https://docs.composio.dev/docs/auth-configuration/custom-auth-configs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the provider's setup guide ↗
              </a>
            </p>
            <form
              className="os-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const value = Object.fromEntries(new FormData(e.currentTarget));
                setBusy(true);
                setError("");
                try {
                  setConnectionIssue(null);
                  const r = await fetch("/api/integrations", {
                    signal: AbortSignal.timeout(40000),
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "auth-config", ...value }),
                  });
                  const v = await r.json();
                  if (!r.ok) {
                    setConnectionIssue(v.diagnostic);
                    throw new Error(v.error);
                  }
                  await checkAccess();
                  setNotice(
                    "Configuration attached. Connect the account above to complete consent. Pending approvals need review again.",
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Service
                <select name="capability">
                  <option value="outreach">Gmail outreach</option>
                  <option value="calendar">Google Calendar</option>
                </select>
              </label>
              <label>
                Composio auth configuration ID
                <input
                  name="id"
                  required
                  pattern="ac_[A-Za-z0-9_-]{3,100}"
                  placeholder="ac_…"
                  autoComplete="off"
                />
              </label>
              <p className="muted">
                Gmail requires gmail.readonly and gmail.send. Calendar requires
                calendar.events. OAuth client secrets stay in Composio.
              </p>
              <button disabled={busy}>Validate and attach configuration</button>
            </form>
          </details>
          {caps?.error && <p className="os-blocker">{caps.error}</p>}
          {!caps?.outreach && (
            <p className="os-blocker">
              Email access is missing. If Google blocks the connection, outreach
              stays unavailable; the app will not bypass it.
            </p>
          )}
          <div className="os-actions">
            <button disabled={busy} onClick={checkAccess}>
              Check access
            </button>
            <button
              className="os-primary"
              disabled={busy || !caps?.outreach}
              onClick={async () => {
                if (await send({ action: "access", mode: "outreach" })) {
                  setSetup(false);
                  if (!profileReady) goProfile();
                }
              }}
            >
              Continue with outreach <ArrowRight size={16} />
            </button>
          </div>
          <div className="os-local">
            <strong>Use local preparation while accounts are blocked</strong>
            <p>
              Discover public jobs and create drafts. Email sending and calendar
              actions stay locked.
            </p>
            <button
              disabled={busy}
              onClick={async () => {
                if (await send({ action: "access", mode: "prepare" })) {
                  setSetup(false);
                  if (!profileReady) goProfile();
                }
              }}
            >
              Continue with preparation only
            </button>
          </div>
        </main>
      ) : (
        <>
          <nav className="os-nav" aria-label="Workspace">
            {tabs.map((t) => (
              <button
                key={t}
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "Work" && holds.length > 0 && (
                  <span className="os-count">{holds.length}</span>
                )}
              </button>
            ))}
            <span className="os-mode" title={"Agent OS " + data.version}>
              {data.settings.workspace_mode === "outreach"
                ? "Outreach mode"
                : "Preparation only"}
            </span>
          </nav>
          <div className="os-agents" aria-label="Live agents">
            <span
              className={`status-dot ${alive && data.settings.autopilot ? "" : "offline"}`}
            />
            <span>
              {!alive
                ? "Worker offline"
                : data.settings.autopilot
                  ? "Agents on"
                  : "Paused"}
            </span>
            {[
              ...data.agents,
              {
                id: "coordinator",
                name: "Coordinator",
                level: data.work.some((w: Row) =>
                  ["sent", "scheduled"].includes(w.status),
                )
                  ? 1
                  : 0,
                label: data.work.some((w: Row) =>
                  ["sent", "scheduled"].includes(w.status),
                )
                  ? "Observed"
                  : "Unproven",
                status: caps?.outreach ? "Monitoring" : "Access needed",
              },
            ].map((a: Row) => {
              const live = data.activity.find((x: Row) => x.agent === a.name);
              return (
                <button
                  key={a.id}
                  onClick={() => setTab("Activity")}
                  title={live?.task ?? a.purpose}
                >
                  <span
                    className={`agent-light ${alive && data.settings.autopilot && ["working", "checking"].includes(live?.state) ? "live" : ""}`}
                  />
                  {a.name}
                  <small>L{a.level}</small>
                  <em>
                    {!alive
                      ? "offline"
                      : !data.settings.autopilot
                        ? "paused"
                        : a.id === "coordinator" && !caps?.outreach
                          ? "access needed"
                          : (live?.state ?? a.status)}
                  </em>
                </button>
              );
            })}
            <button
              className="os-pause"
              disabled={busy}
              onClick={() =>
                send(
                  {
                    action: "settings",
                    value: {
                      ...data.settings,
                      autopilot: !data.settings.autopilot,
                    },
                  },
                  true,
                )
              }
            >
              {data.settings.autopilot ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}
              <span>{data.settings.autopilot ? "Pause" : "Resume"}</span>
            </button>
          </div>
          <main className="os-main">
            {messages()}
            {tab === "Today" && (
              <>
                <div className="os-title">
                  <div>
                    <span className="os-step">YOUR DAY, AT A GLANCE</span>
                    <h1>Make the next connection.</h1>
                    <p>
                      {data.metrics.new_today} new leads today.{" "}
                      {data.totals.queued} tasks waiting or running.
                    </p>
                  </div>
                  <button onClick={() => setTab("Leads")}>
                    Find opportunities <ArrowRight size={16} />
                  </button>
                </div>
                {!profileReady && (
                  <section className="os-card os-profile-call">
                    <div>
                      <h2>Paste your résumé to get started.</h2>
                      <p>
                        Notes, résumé text, Markdown or copied profile content.
                        No field-by-field form.
                      </p>
                    </div>
                    <button className="os-primary" onClick={goProfile}>
                      Add my background
                    </button>
                  </section>
                )}
                <div className="os-metrics">
                  {[
                    ["Real leads", data.metrics.leads],
                    ["Drafts saved", data.totals.drafts],
                    ["Emails sent", data.metrics.sent],
                    ["Calendar invitations", data.metrics.meetings],
                  ].map(([label, n]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{n}</strong>
                    </div>
                  ))}
                </div>
                <div className="os-columns">
                  <section className="os-card">
                    <div className="os-section-head">
                      <h2>Latest leads</h2>
                      <button
                        className="os-link"
                        onClick={() => setTab("Leads")}
                      >
                        View all <ArrowUpRight size={14} />
                      </button>
                    </div>
                    {leads.slice(0, 4).map((o: Row) => (
                      <button
                        className="lead-row"
                        key={o.id}
                        onClick={() => {
                          setTab("Leads");
                          setSearch(o.company);
                        }}
                      >
                        <span className="company-avatar">{o.company[0]}</span>
                        <span>
                          <strong>{o.title}</strong>
                          <small>
                            {o.company} · {o.country}
                          </small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    {!leads.length && (
                      <p>No real leads yet. Add an approved source in Leads.</p>
                    )}
                  </section>
                  <section className="os-card">
                    <div className="os-section-head">
                      <h2>What’s holding things up</h2>
                      <span className="tag amber">
                        {blockers.length + holds.length}
                      </span>
                    </div>
                    {(!caps?.outreach ||
                      data.settings.workspace_mode !== "outreach") && (
                      <button
                        className="os-blocker-row"
                        onClick={() => setSetup(true)}
                      >
                        <Mail size={17} />
                        <span>
                          <strong>Email access</strong>
                          <small>
                            Connect an account to enable approved outreach.
                          </small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    )}
                    {holds.slice(0, 3).map((w: Row) => (
                      <button
                        className="os-blocker-row"
                        key={w.id}
                        onClick={() => setTab("Work")}
                      >
                        <span className="status-dot waiting" />
                        <span>
                          <strong>{w.title}</strong>
                          <small>
                            {w.status === "draft"
                              ? "Approval needed before sending"
                              : (w.error ?? "Action blocked")}
                          </small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    {blockers.slice(0, 3).map((b: Row) => (
                      <button
                        className="os-blocker-row"
                        key={b.id}
                        onClick={() => setTab("Work")}
                      >
                        <span className="status-dot waiting" />
                        <span>
                          <strong>{b.title}</strong>
                          <small>
                            {b.status === "blocked"
                              ? "Missing fact or unavailable action"
                              : "Review needed"}
                          </small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    {!blockers.length && !holds.length && caps?.outreach && (
                      <p>
                        No open blockers. Agents will keep preparing eligible
                        work.
                      </p>
                    )}
                  </section>
                </div>
                <div className="os-columns">
                  <section className="os-card">
                    <h2>Upcoming meetings</h2>
                    {upcoming.length ? (
                      upcoming.map((w: Row) => (
                        <div className="os-list-item" key={w.id}>
                          <strong>{w.title}</strong>
                          <p>
                            {new Date(w.due_at).toLocaleString()} · {w.minutes}{" "}
                            min
                          </p>
                          <small>Invitation created · {w.recipient}</small>
                        </div>
                      ))
                    ) : (
                      <p>
                        No confirmed calendar records yet. Meeting drafts appear
                        in Work.
                      </p>
                    )}
                    <button
                      className="os-link"
                      onClick={() => {
                        setTab("Work");
                        setWorkKind("meeting");
                      }}
                    >
                      Plan a meeting <ArrowRight size={14} />
                    </button>
                  </section>
                  <section className="os-card">
                    <h2>Learning from outcomes</h2>
                    <p>
                      {data.metrics.replies} recorded positive outcomes.{" "}
                      {data.learning.length} source/country outcome groups.
                    </p>
                    <p>
                      Recorded feedback helps comparison. Strategy changes are
                      not promoted automatically.
                    </p>
                    <button
                      className="os-link"
                      onClick={() => {
                        setTab("Library");
                        setSection("Learning");
                      }}
                    >
                      See evidence <ArrowRight size={14} />
                    </button>
                  </section>
                </div>
              </>
            )}
            {tab === "Leads" && (
              <>
                <div className="os-title">
                  <div>
                    <h1>Your next opportunities.</h1>
                    <p>
                      Real jobs and client projects, with their source and
                      preparation status.
                    </p>
                  </div>
                </div>
                <div className="os-toolbar">
                  <label className="os-search">
                    <Search size={17} />
                    <input
                      aria-label="Search leads"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Role, company or location"
                    />
                  </label>
                  <label className="os-check">
                    <input
                      type="checkbox"
                      checked={showSamples}
                      onChange={(e) => setShowSamples(e.target.checked)}
                    />
                    Show samples
                  </label>
                </div>
                <details className="os-card">
                  <summary>
                    Sources · {data.sources.length} connected boards
                  </summary>
                  <p>
                    Approved public boards refresh every six hours. Discovery
                    does not contact anyone.
                  </p>
                  {data.sources.map((s: Row) => (
                    <div className="source-row" key={s.id}>
                      <span>
                        <strong>{s.company}</strong>
                        <small>
                          {s.provider} ·{" "}
                          {s.sync_error ??
                            (s.last_sync
                              ? "Last checked " +
                                new Date(s.last_sync).toLocaleString()
                              : "Not checked yet")}
                        </small>
                      </span>
                      <button
                        disabled={busy}
                        onClick={() => send({ action: "sync", id: s.id }, true)}
                      >
                        Refresh
                      </button>
                    </div>
                  ))}
                  <form
                    className="os-inline-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = e.currentTarget;
                      const v = Object.fromEntries(new FormData(f));
                      if (await send({ action: "source", value: v }, true))
                        f.reset();
                    }}
                  >
                    <input name="company" placeholder="Company" required />
                    <select name="provider">
                      <option value="greenhouse">Greenhouse</option>
                      <option value="lever">Lever</option>
                    </select>
                    <input name="slug" placeholder="Board slug" required />
                    <input
                      name="keywords"
                      defaultValue="engineer,developer,architect,technical lead"
                      aria-label="Role keywords"
                    />
                    <button disabled={busy}>Add source</button>
                  </form>
                </details>
                <details className="os-card">
                  <summary>Add a known job or client project</summary>
                  <form
                    className="os-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const value = Object.fromEntries(new FormData(form));
                      if (await send({ action: "opportunity", value }, true)) {
                        form.reset();
                        feedback("Lead saved without contacting anyone.");
                      }
                    }}
                  >
                    <label>
                      Type
                      <select name="kind">
                        <option value="job">Job</option>
                        <option value="client">Client project</option>
                      </select>
                    </label>
                    <div className="os-form-row">
                      <label>
                        Title
                        <input
                          name="title"
                          minLength={3}
                          maxLength={180}
                          required
                        />
                      </label>
                      <label>
                        Company
                        <input
                          name="company"
                          minLength={2}
                          maxLength={160}
                          required
                        />
                      </label>
                    </div>
                    <div className="os-form-row">
                      <label>
                        Location
                        <input
                          name="country"
                          minLength={2}
                          maxLength={120}
                          required
                        />
                      </label>
                      <label>
                        Source
                        <input
                          name="source"
                          minLength={2}
                          maxLength={120}
                          required
                        />
                      </label>
                    </div>
                    <label>
                      Original link
                      <input name="url" type="url" />
                    </label>
                    <label>
                      Paste opportunity text
                      <textarea
                        name="description"
                        minLength={30}
                        maxLength={15000}
                        rows={5}
                        required
                      />
                    </label>
                    <button disabled={busy}>Save lead</button>
                  </form>
                </details>
                <div className="lead-grid">
                  {leads.map((o: Row) => (
                    <article className="os-card lead-card" key={o.id}>
                      <div className="os-card-heading">
                        <span className="company-avatar">{o.company[0]}</span>
                        <span className="tag">
                          {o.sample
                            ? "Sample"
                            : o.status === "prepared"
                              ? "Draft ready"
                              : o.status}
                        </span>
                      </div>
                      <span className="lead-company">{o.company}</span>
                      <h2>{o.title}</h2>
                      <p className="lead-location">
                        {o.country} ·{" "}
                        {o.kind === "client" ? "Client project" : "Job"}
                      </p>
                      <div className="lead-description">
                        {o.description
                          .split(/\n+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p: string, i: number) => (
                            <p key={i}>{p}</p>
                          ))}
                      </div>
                      <details>
                        <summary>Read full opportunity</summary>
                        <div className="formatted-copy">
                          {o.description
                            .split(/\n+/)
                            .filter(Boolean)
                            .map((p: string, i: number) => (
                              <p key={i}>{p}</p>
                            ))}
                        </div>
                      </details>
                      <div className="os-card-actions">
                        {o.url && (
                          <a
                            href={o.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Original listing <ArrowUpRight size={13} />
                          </a>
                        )}
                        <button
                          disabled={busy}
                          onClick={async () => {
                            const existing = data.artifacts.find(
                              (a: Row) => a.opportunity_id === o.id,
                            );
                            if (existing) {
                              setShowDraft(existing);
                              return;
                            }
                            if (await send({ action: "queue", id: o.id }, true))
                              feedback(
                                "Preparation queued. No application was submitted.",
                              );
                          }}
                        >
                          {o.status === "prepared"
                            ? "Check draft"
                            : "Prepare draft"}
                        </button>
                      </div>
                      <label className="outcome-label">
                        Record result
                        <select
                          aria-label={"Result for " + o.company + " " + o.title}
                          defaultValue={
                            data.feedback.find(
                              (f: Row) => f.opportunity_id === o.id,
                            )?.outcome ?? ""
                          }
                          onChange={async (e) => {
                            if (e.target.value)
                              await send(
                                {
                                  action: "feedback",
                                  value: {
                                    id: o.id,
                                    outcome: e.target.value,
                                    note: "Owner recorded in lead card",
                                  },
                                },
                                true,
                              );
                          }}
                        >
                          <option value="" disabled>
                            No result yet
                          </option>
                          <option value="replied">Replied</option>
                          <option value="interview">Interview</option>
                          <option value="rejected">Rejected</option>
                          <option value="won">Won</option>
                          <option value="no_reply">No reply</option>
                        </select>
                      </label>
                      <small>
                        {o.source} · Skills overlap {o.score ?? "—"}; not a
                        hiring probability
                      </small>
                    </article>
                  ))}
                </div>
                {!leads.length && (
                  <div className="os-empty">
                    No matching leads yet. Change your search or connect a
                    source.
                  </div>
                )}
              </>
            )}
            {tab === "Work" && (
              <>
                <div className="os-title">
                  <div>
                    <h1>Work, with a clear next step.</h1>
                    <p>
                      Draft → exact approval → provider confirmation. Unknown
                      delivery is held, never blindly retried.
                    </p>
                  </div>
                </div>
                <section className="os-card">
                  <div className="os-section-head">
                    <h2>Create a message or meeting</h2>
                    <span className="tag">Review first</span>
                  </div>
                  <form
                    className="os-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = e.currentTarget;
                      const v = Object.fromEntries(new FormData(f));
                      const due = v.due_at
                        ? new Date(String(v.due_at)).toISOString()
                        : null;
                      if (
                        await send({
                          action: "work",
                          value: {
                            ...v,
                            minutes: Number(v.minutes || 30),
                            due_at: due,
                          },
                        })
                      ) {
                        f.reset();
                        feedback("Draft saved. Nothing sent.");
                      }
                    }}
                  >
                    <div className="os-form-row">
                      <label>
                        Action
                        <select
                          name="kind"
                          value={workKind}
                          onChange={(e) => setWorkKind(e.target.value)}
                        >
                          <option value="email">Email</option>
                          <option value="followup">Follow-up email</option>
                          <option value="meeting">Meeting invitation</option>
                        </select>
                      </label>
                      <label>
                        Recipient
                        <input
                          name="recipient"
                          type="email"
                          placeholder="Known contact email"
                          required
                        />
                      </label>
                    </div>
                    <label>
                      {workKind === "meeting" ? "Meeting title" : "Subject"}
                      <input
                        name="title"
                        required
                        minLength={3}
                        maxLength={180}
                        defaultValue={workSeed.title ?? ""}
                        key={"title" + (workSeed.id ?? "")}
                      />
                    </label>
                    <label>
                      {workKind === "meeting" ? "Agenda" : "Message"}
                      <textarea
                        name="body"
                        minLength={10}
                        maxLength={10000}
                        required
                        rows={6}
                        defaultValue={workSeed.content ?? ""}
                        key={"body" + (workSeed.id ?? "")}
                      />
                    </label>
                    <div className="os-form-row">
                      <label>
                        {workKind === "meeting"
                          ? "Meeting time"
                          : "Send after (optional)"}{" "}
                        · {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        <input
                          name="due_at"
                          type="datetime-local"
                          required={workKind === "meeting"}
                        />
                      </label>
                      {workKind === "meeting" && (
                        <label>
                          Minutes
                          <select name="minutes">
                            <option>30</option>
                            <option>45</option>
                            <option>60</option>
                          </select>
                        </label>
                      )}
                    </div>
                    <button disabled={busy}>Save draft</button>
                  </form>
                </section>
                {data.work.map((w: Row) => (
                  <section className="os-card work-card" key={w.id}>
                    <div className="os-section-head">
                      <h2>{w.title}</h2>
                      <span
                        className={`tag ${["blocked", "unknown"].includes(w.status) ? "amber" : ""}`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <p>
                      {w.kind} · {w.recipient}
                      {w.due_at
                        ? " · " + new Date(w.due_at).toLocaleString()
                        : ""}
                    </p>
                    <div className="formatted-copy">
                      {w.body.split("\n").map((line: string, i: number) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    {w.error && <p className="os-blocker">{w.error}</p>}
                    {w.provider_id && (
                      <small>
                        Provider receipt: {w.provider_id}.{" "}
                        {w.kind === "meeting"
                          ? "Attendee acceptance is not confirmed."
                          : "Provider acceptance does not prove delivery or reading."}
                      </small>
                    )}
                    {w.status === "draft" && (
                      <div className="os-actions">
                        <button
                          className="os-primary"
                          disabled={
                            busy ||
                            data.settings.workspace_mode !== "outreach" ||
                            !(w.kind === "meeting"
                              ? caps?.calendar
                              : caps?.outreach)
                          }
                          onClick={() =>
                            send({
                              action: "approve-work",
                              id: w.id,
                              hash: w.payload_hash,
                            })
                          }
                        >
                          Approve exact{" "}
                          {w.kind === "meeting" ? "invitation" : "message"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            send({ action: "cancel-work", id: w.id })
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <button
                      className="os-link"
                      disabled={busy}
                      onClick={() =>
                        send({ action: "suppress", email: w.recipient })
                      }
                    >
                      Stop contacting this recipient
                    </button>
                  </section>
                ))}
                <section className="os-card">
                  <h2>Prepared application & profile drafts</h2>
                  {data.artifacts.map((a: Row) => (
                    <button
                      key={a.id}
                      className="lead-row"
                      onClick={() => setShowDraft(a)}
                    >
                      <FileText size={18} />
                      <span>
                        <strong>{a.title}</strong>
                        <small>{a.kind}</small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </section>
                <section className="os-card">
                  <div className="os-section-head">
                    <h2>Blockers & answers</h2>
                    <span className="tag amber">
                      {blockers.length + holds.length}
                    </span>
                  </div>
                  {blockers.map((b: Row) => (
                    <details className="os-blocker-detail" key={b.id}>
                      <summary>
                        {b.title}
                        <span className="tag">{b.status}</span>
                      </summary>
                      <p>{b.detail}</p>
                      <form
                        className="os-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const answer = String(
                            new FormData(e.currentTarget).get("answer"),
                          );
                          if (
                            await send(
                              { action: "decision", id: b.id, answer },
                              true,
                            )
                          )
                            feedback(
                              "Context recorded. Nothing sent and profile facts unchanged.",
                            );
                        }}
                      >
                        <label>
                          Add missing context
                          <textarea
                            name="answer"
                            required
                            minLength={1}
                            maxLength={3000}
                            placeholder="Paste what is known, only if needed"
                          />
                        </label>
                        <button disabled={busy}>Save context</button>
                      </form>
                      {b.answer && (
                        <pre className="resolution-text">{b.answer}</pre>
                      )}
                      <small>
                        {b.handled_by
                          ? "Handled by " + b.handled_by
                          : "Awaiting evidence or supported capability"}
                        . Other preparation continues.
                      </small>
                    </details>
                  ))}
                </section>
              </>
            )}
            {tab === "Library" && (
              <>
                <div className="os-title">
                  <div>
                    <h1>Your knowledge, ready to use.</h1>
                    <p>
                      Paste your background once. Keep facts, writing skills and
                      outcome evidence separate.
                    </p>
                  </div>
                </div>
                <div className="os-subnav">
                  {[
                    "Profile",
                    "Knowledge",
                    "Skills",
                    "Learning",
                    "Limits",
                    "System",
                  ].map((t) => (
                    <button
                      key={t}
                      className={section === t ? "selected" : ""}
                      onClick={() => setSection(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {section === "System" && (
                  <>
                    <section className="os-card">
                      <h2>Agent OS {data.release.version}</h2>
                      <p>
                        {data.release.name} · {data.release.stage}
                      </p>
                      <p>
                        Preparation runs automatically while this computer and
                        Docker are awake. Outreach requires connected accounts
                        and exact approvals. Website submissions remain
                        unavailable.
                      </p>
                      <button
                        disabled={busy}
                        onClick={() => {
                          refresh();
                          checkAccess();
                        }}
                      >
                        Refresh readiness
                      </button>
                    </section>
                    <div className="activity-grid">
                      {data.readiness.map((r: Row) => (
                        <section className="os-card" key={r.id}>
                          <div className="os-section-head">
                            <h2>{r.label}</h2>
                            <span
                              className={
                                "tag " +
                                (r.state === "ready" ? "good" : "amber")
                              }
                            >
                              {r.state}
                            </span>
                          </div>
                          <p>{r.detail}</p>
                        </section>
                      ))}
                      <section className="os-card">
                        <h2>Email & calendar</h2>
                        <p>
                          {caps?.details?.outreach ?? "Checking Gmail access…"}
                        </p>
                        <p>
                          {caps?.details?.calendar ??
                            "Checking calendar access…"}
                        </p>
                        <button
                          onClick={() => {
                            setSetup(true);
                            checkAccess();
                          }}
                        >
                          Manage access
                        </button>
                      </section>
                      <section className="os-card">
                        <h2>AI & subscription</h2>
                        <p>
                          <strong>
                            {data.aiRuntime.provider} · {data.aiRuntime.runtime}
                          </strong>
                        </p>
                        <p>Charged to: {data.aiRuntime.billing}</p>
                        <p>{data.aiRuntime.subscription}</p>
                        <p>Model selection: {data.aiRuntime.model}</p>
                        <small>
                          Login method checked{" "}
                          {new Date(
                            data.aiRuntime.checkedAt,
                          ).toLocaleTimeString()}
                          . This is the local worker's login, which may differ
                          from your browser or desktop chat account.
                        </small>
                        <h3>App usage today (UTC)</h3>
                        <p>
                          {data.metrics.ai_attempts} attempts ·{" "}
                          {Number(data.metrics.input_tokens).toLocaleString()}{" "}
                          input tokens ·{" "}
                          {Number(data.metrics.output_tokens).toLocaleString()}{" "}
                          output tokens reported.
                        </p>
                        <p>
                          {data.metrics.unmetered_attempts} attempts have
                          incomplete usage. Token totals are not a complete
                          bill. No automatic switch to a paid API fallback.
                        </p>
                        <div className="os-table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Task</th>
                                <th>Attempts</th>
                                <th>Input</th>
                                <th>Output</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.aiUsage.map((u: Row, i: number) => (
                                <tr key={i}>
                                  <td>
                                    {u.kind === "ai-brief"
                                      ? "Analyst · tailored briefs"
                                      : "Importer · résumé parsing"}
                                    <small style={{ display: "block" }}>
                                      {u.model_id ?? "Model not recorded"} ·{" "}
                                      {u.auth_mode ??
                                        "Historical billing method not recorded"}
                                    </small>
                                  </td>
                                  <td>{u.attempts}</td>
                                  <td>
                                    {u.input_tokens == null
                                      ? "Not reported"
                                      : Number(u.input_tokens).toLocaleString()}
                                  </td>
                                  <td>
                                    {u.output_tokens == null
                                      ? "Not reported"
                                      : Number(
                                          u.output_tokens,
                                        ).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p>
                          Scout, Preparer, Resolver, dashboard refreshes and
                          direct email/calendar actions do not call an AI model.
                          Composio account/tool usage is separate and is not
                          included in these token totals.
                        </p>
                        <p>
                          Only Agent OS tasks are counted here; other chats and
                          projects are excluded. Missing usage and historical
                          model information cannot be reconstructed.
                        </p>
                        <a
                          href="https://learn.chatgpt.com/docs/auth"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          How Codex sign-in and billing work ↗
                        </a>
                        <small>
                          Daily limits use UTC. Local drafting and status
                          updates use zero model tokens.
                        </small>
                      </section>
                    </div>
                  </>
                )}
                {section === "Limits" && (
                  <section className="os-card">
                    <h2>Daily working limits</h2>
                    <p>
                      Local drafts use no model tokens. Profile parsing and AI
                      briefs share one daily AI cap. External actions have a
                      separate hard cap of 10 per day.
                    </p>
                    <form
                      className="os-form"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const v = Object.fromEntries(
                          new FormData(e.currentTarget),
                        );
                        if (
                          await send(
                            {
                              action: "settings",
                              value: {
                                autopilot: data.settings.autopilot,
                                daily_limit: Number(v.daily_limit),
                                ai_daily_limit: Number(v.ai_daily_limit),
                                ai_assist: v.ai_assist === "on",
                                execution_mode: v.execution_mode,
                              },
                            },
                            true,
                          )
                        )
                          feedback("Limits saved.");
                      }}
                    >
                      <label>
                        Local drafts per day
                        <input
                          name="daily_limit"
                          type="number"
                          min={1}
                          max={1000}
                          defaultValue={data.settings.daily_limit}
                        />
                      </label>
                      <label>
                        AI attempts per day
                        <input
                          name="ai_daily_limit"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={data.settings.ai_daily_limit}
                        />
                      </label>
                      <label>
                        <input
                          name="ai_assist"
                          type="checkbox"
                          defaultChecked={data.settings.ai_assist}
                        />
                        Enable automatic AI briefs
                      </label>
                      <label>
                        Local worker capacity
                        <select
                          name="execution_mode"
                          defaultValue={data.settings.execution_mode}
                        >
                          <option value="balanced">Balanced</option>
                          <option value="performance">Performance</option>
                        </select>
                      </label>
                      <button disabled={busy}>Save limits</button>
                    </form>
                  </section>
                )}
                {section === "Profile" && (
                  <>
                    <section className="os-card">
                      <h2>Refresh your public profiles</h2>
                      <p>
                        Create editable content from saved facts. Publishing
                        remains manual.
                      </p>
                      <div className="os-actions">
                        {["LinkedIn", "GitHub", "Upwork", "Portfolio"].map(
                          (platform) => (
                            <button
                              key={platform}
                              disabled={busy || !profileReady}
                              onClick={async () => {
                                if (
                                  await send(
                                    { action: "presence", platform },
                                    true,
                                  )
                                ) {
                                  setTab("Work");
                                  feedback("Profile draft ready in Work.");
                                }
                              }}
                            >
                              {platform}
                            </button>
                          ),
                        )}
                      </div>
                    </section>
                    <section className="os-card">
                      <h2>Paste. Parse. Review.</h2>
                      <p>
                        Résumé text, project notes, copied profile content,
                        Markdown or JSON. The parser extracts facts with source
                        quotes. Missing details stay missing.
                      </p>
                      <textarea
                        className="paste-box"
                        aria-label="Paste résumé or background"
                        placeholder="Paste your résumé and project details here…"
                        value={raw}
                        onChange={(e) => {
                          setRaw(e.target.value);
                          setPreview(null);
                        }}
                        maxLength={60000}
                      />
                      <div className="os-actions">
                        <span className="muted">
                          {raw.length.toLocaleString()} / 60,000 characters ·
                          uses your AI allowance
                        </span>
                        <button
                          className="os-primary"
                          disabled={busy || raw.trim().length < 30}
                          onClick={async () => {
                            const v = await send({
                              action: "parse-profile",
                              text: raw,
                            });
                            if (v) setPreview(v);
                          }}
                        >
                          {busy ? "Working…" : "Parse my background"}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </section>
                    {preview && (
                      <section className="os-card">
                        <div className="os-section-head">
                          <h2>Review the extracted profile</h2>
                          <span className="tag">Not saved yet</span>
                        </div>
                        <ProfileView profile={preview.profile} />
                        {preview.missing.length > 0 && (
                          <p className="os-blocker">
                            Missing or invalid: {preview.missing.join(", ")}.
                            Add the missing details to your pasted text and
                            parse again.
                          </p>
                        )}
                        {preview.warnings.map((w: string, i: number) => (
                          <p className="os-blocker" key={i}>
                            {w}
                          </p>
                        ))}
                        <details>
                          <summary>
                            See source quotes · {preview.facts.length} facts
                          </summary>
                          {preview.facts.map((f: Row, i: number) => (
                            <blockquote key={i}>
                              <strong>
                                {f.field}: {f.value}
                              </strong>
                              <p>{f.quote}</p>
                            </blockquote>
                          ))}
                        </details>
                        <button
                          className="os-primary"
                          disabled={busy || preview.missing.length > 0}
                          onClick={async () => {
                            if (
                              await send({
                                action: "accept-profile",
                                id: preview.id,
                              })
                            ) {
                              setPreview(null);
                              feedback(
                                "Profile saved. Future work uses these facts.",
                              );
                            }
                          }}
                        >
                          Use this profile
                        </button>
                      </section>
                    )}
                    {profileReady && (
                      <section className="os-card">
                        <h2>Saved profile</h2>
                        <ProfileView profile={data.settings.profile} />
                      </section>
                    )}
                  </>
                )}
                {section === "Knowledge" && (
                  <>
                    <section className="os-card">
                      <h2>Add a note or reference</h2>
                      <p>
                        Paste professional facts, project context or source
                        material. Notes are context, not permission to change
                        facts or send messages.
                      </p>
                      <form
                        className="os-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const f = e.currentTarget;
                          if (
                            await send({
                              action: "knowledge",
                              value: Object.fromEntries(new FormData(f)),
                            })
                          ) {
                            f.reset();
                            feedback("Knowledge saved.");
                          }
                        }}
                      >
                        <input
                          name="title"
                          placeholder="A short title"
                          required
                        />
                        <textarea
                          name="content"
                          rows={7}
                          minLength={10}
                          maxLength={60000}
                          required
                          placeholder="Paste your notes…"
                        />
                        <button disabled={busy}>Save to knowledge</button>
                      </form>
                    </section>
                    {data.knowledge.map((k: Row) => (
                      <section className="os-card" key={k.id}>
                        <div className="os-section-head">
                          <h2>{k.title}</h2>
                          <label className="os-check">
                            <input
                              type="checkbox"
                              checked={k.active}
                              onChange={(e) =>
                                send({
                                  action: "toggle-knowledge",
                                  id: k.id,
                                  enabled: e.target.checked,
                                })
                              }
                            />
                            Use as context
                          </label>
                        </div>
                        <details>
                          <summary>Read note</summary>
                          <pre className="resolution-text">{k.content}</pre>
                        </details>
                      </section>
                    ))}
                  </>
                )}
                {section === "Skills" && (
                  <>
                    <div className="skill-grid">
                      {data.skills.builtin.map((s: Row) => (
                        <section className="os-card" key={s.name}>
                          <span className="tag">{s.state}</span>
                          <h2>{s.name}</h2>
                          <p>{s.description}</p>
                          <small>{s.agent}</small>
                        </section>
                      ))}
                    </div>
                    <section className="os-card">
                      <h2>Add a writing skill</h2>
                      <p>
                        Add reusable instructions for tone, structure or
                        emphasis. These cannot install code, grant access or
                        override facts. Up to three enabled skills are used per
                        brief.
                      </p>
                      <form
                        className="os-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const f = e.currentTarget;
                          if (
                            await send({
                              action: "skill",
                              value: Object.fromEntries(new FormData(f)),
                            })
                          ) {
                            f.reset();
                            feedback("Writing skill added.");
                          }
                        }}
                      >
                        <input
                          name="name"
                          required
                          placeholder="e.g. Concise project proposals"
                        />
                        <textarea
                          name="instructions"
                          required
                          minLength={10}
                          maxLength={1300}
                          rows={4}
                          placeholder="Describe how the draft should be written…"
                        />
                        <button disabled={busy}>Add skill</button>
                      </form>
                    </section>
                    {data.skills.custom.map((s: Row) => (
                      <section className="os-card" key={s.id}>
                        <div className="os-section-head">
                          <h2>{s.name}</h2>
                          <label className="os-check">
                            <input
                              type="checkbox"
                              checked={s.enabled}
                              onChange={(e) =>
                                send({
                                  action: "toggle-skill",
                                  id: s.id,
                                  enabled: e.target.checked,
                                })
                              }
                            />
                            Enabled
                          </label>
                        </div>
                        <p>{s.instructions}</p>
                      </section>
                    ))}
                  </>
                )}
                {section === "Learning" && (
                  <section className="os-card">
                    <h2>Observed outcomes</h2>
                    <p>
                      These are recorded outcomes, not predictions. Small
                      cohorts do not prove that a strategy works.
                    </p>
                    {data.learning.length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Source</th>
                              <th>Country</th>
                              <th>Outcome</th>
                              <th>Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.learning.map((r: Row, i: number) => (
                              <tr key={i}>
                                <td>{r.source}</td>
                                <td>{r.country}</td>
                                <td>{r.outcome}</td>
                                <td>{r.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="os-empty">No real outcome data yet.</div>
                    )}
                  </section>
                )}
              </>
            )}
            {tab === "Activity" && (
              <>
                <div className="os-title">
                  <div>
                    <h1>See the work happening.</h1>
                    <p>
                      Live updates every five seconds. Waiting means no eligible
                      task is being processed.
                    </p>
                  </div>
                </div>
                <div className="activity-grid">
                  {data.activity.map((a: Row) => (
                    <section className="os-card" key={a.agent}>
                      <div className="os-section-head">
                        <h2>{a.agent}</h2>
                        <span className="tag">
                          {!alive
                            ? "Offline"
                            : !data.settings.autopilot
                              ? "Paused"
                              : a.state}
                        </span>
                      </div>
                      <p>{a.task}</p>
                      <small>
                        Updated {new Date(a.updated_at).toLocaleTimeString()}
                      </small>
                    </section>
                  ))}
                </div>
                <section className="os-card">
                  <h2>Audit timeline</h2>
                  {data.audit.map((a: Row) => (
                    <details className="audit-entry" key={a.id}>
                      <summary>
                        <span>
                          {a.agent} · {a.action}
                        </span>
                        <span className="tag">{a.status}</span>
                        <small>{new Date(a.created_at).toLocaleString()}</small>
                      </summary>
                      <pre className="resolution-text">
                        {JSON.stringify(a.detail, null, 2)}
                      </pre>
                      <small>Record {a.id}</small>
                    </details>
                  ))}
                </section>
                <section className="os-card">
                  <h2>Recent workflow results</h2>
                  {data.runs.slice(0, 30).map((r: Row) => (
                    <div className="os-list-item" key={r.id}>
                      <strong>{r.title ?? r.kind}</strong>
                      <span className="tag">{r.status}</span>
                      <small>
                        {r.kind} · {new Date(r.created_at).toLocaleString()}
                      </small>
                      {r.error && <p className="os-blocker">{r.error}</p>}
                    </div>
                  ))}
                </section>
              </>
            )}
            <footer className="os-footer">
              Agent OS {data.version} · Private local workspace · No guaranteed
              lead, interview or revenue volume. Browser applications remain
              unavailable.
            </footer>
          </main>
        </>
      )}
      {showDraft && (
        <div className="os-modal-backdrop">
          <dialog
            ref={dialog}
            onCancel={() => setShowDraft(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Draft preview"
            className="os-modal"
          >
            <div className="os-section-head">
              <h2>{showDraft.title}</h2>
              <button
                aria-label="Close draft"
                onClick={() => setShowDraft(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="formatted-copy">
              <FormattedText text={showDraft.content} />
            </div>
            <details>
              <summary>Edit this draft</summary>
              <form
                className="os-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const content = String(
                    new FormData(e.currentTarget).get("content"),
                  );
                  if (
                    await send(
                      { action: "artifact", id: showDraft.id, content },
                      true,
                    )
                  ) {
                    setShowDraft({ ...showDraft, content });
                    feedback("Draft saved with revision history.");
                  }
                }}
              >
                <textarea
                  name="content"
                  defaultValue={showDraft.content}
                  rows={12}
                  minLength={10}
                  maxLength={30000}
                  required
                />
                <button disabled={busy}>Save changes</button>
              </form>
            </details>
            <a className="os-primary" href={"/api/export?id=" + showDraft.id}>
              Download draft
            </a>
            <button
              disabled={!draftMessage(showDraft.content)}
              onClick={() => {
                setWorkSeed({
                  ...showDraft,
                  content: draftMessage(showDraft.content),
                });
                setTab("Work");
                setShowDraft(null);
              }}
            >
              Prepare outreach from this draft
            </button>
          </dialog>
        </div>
      )}
    </div>
  );
}
function ProfileView({ profile: p }: { profile: Row }) {
  return (
    <div className="profile-view">
      <h3>{p.name || "Name not found"}</h3>
      <p>{p.headline}</p>
      <small>
        {[p.email, p.location, p.website].filter(Boolean).join(" · ")}
      </small>
      <p>{p.summary}</p>
      <div className="skill-tags">
        {p.skills?.map((s: string) => (
          <span className="tag" key={s}>
            {s}
          </span>
        ))}
      </div>
      {p.projects?.length > 0 && (
        <>
          <h3>Projects</h3>
          {p.projects.map((s: string, i: number) => (
            <p key={i}>{s}</p>
          ))}
        </>
      )}
      {p.experience?.length > 0 && (
        <>
          <h3>Experience</h3>
          {p.experience.map((s: string, i: number) => (
            <p key={i}>{s}</p>
          ))}
        </>
      )}
      {p.evidence?.length > 0 && (
        <details>
          <summary>Supporting facts · {p.evidence.length}</summary>
          <ul>
            {p.evidence.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((block, i) => {
        const lines = block.split("\n"),
          heading = lines[0].match(/^#{1,6}\s+(.+)$/);
        const rest = heading ? lines.slice(1) : lines;
        return (
          <div key={i}>
            {heading && <h3>{heading[1]}</h3>}
            {rest.length > 0 &&
              (rest.every((line) => /^[-•] /.test(line)) ? (
                <ul>
                  {rest.map((line, j) => (
                    <li key={j}>{line.slice(2)}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ whiteSpace: "pre-wrap" }}>{rest.join("\n")}</p>
              ))}
          </div>
        );
      })}
    </>
  );
}
