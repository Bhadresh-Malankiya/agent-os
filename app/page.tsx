"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Compass,
  FileText,
  Globe,
  Layers,
  Pause,
  Play,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Workflow,
  X,
  Download,
  RefreshCw,
} from "lucide-react";
type Row = Record<string, any>;
const navigation = [
  ["overview", "Home", Compass],
  ["opportunities", "Opportunities", BriefcaseBusiness],
  ["decisions", "Inbox", Bell],
  ["content", "Drafts", FileText],
  ["agents", "Agents", Workflow],
  ["activity", "Activity & audit", Activity],
  ["profile", "Your profile", User],
  ["learning", "Learning", Sparkles],

  ["connections", "Connections", Globe],
  ["settings", "Settings", Settings],
] as const;
const blankProfile = {
  name: "",
  email: "",
  headline: "",
  location: "",
  summary: "",
  skills: [],
  evidence: [],
  website: "",
  source: "Owner supplied",
  targetRoles: [],
};
export default function Home() {
  const [data, setData] = useState<Row | null>(null);
  const [view, setView] = useState("overview");
  const [more, setMore] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [error, setError] = useState("");
  const [connectionLost, setConnectionLost] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<"opportunity" | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [profile, setProfile] = useState<Row>(blankProfile);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [connectionStatus, setConnectionStatus] = useState<Row | null>(null);
  const [connectUrl, setConnectUrl] = useState("");
  const [editingArtifact, setEditingArtifact] = useState<Row | null>(null);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setData(value);
      setConnectionLost(false);
      setError("");
    } catch (e) {
      setConnectionLost(true);
      setError(e instanceof Error ? e.message : "Connection lost");
    }
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (data && !editing)
      setProfile({ ...blankProfile, ...data.settings.profile });
  }, [data, editing]);
  async function act(body: Row, message = "Saved") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setNotice(message);
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function checkConnections() {
    setBusy(true);
    try {
      const r = await fetch("/api/integrations");
      const value = await r.json();
      if (!r.ok) throw new Error(value.error);
      setConnectionStatus(value);
      setNotice("Connection status refreshed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection check failed");
    } finally {
      setBusy(false);
    }
  }
  async function connect(toolkit: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit }),
      });
      const value = await r.json();
      if (!r.ok) throw new Error(value.error);
      setConnectUrl(value.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection setup failed");
    } finally {
      setBusy(false);
    }
  }
  const open =
    data?.decisions.filter((d: Row) =>
      ["open", "blocked"].includes(d.status),
    ) ?? [];
  const openCount = data?.totals?.open ?? open.length;
  const prepared =
    data?.artifacts.filter((a: Row) => a.kind === "package") ?? [];
  const running =
    data?.runs.filter((r: Row) => ["queued", "running"].includes(r.status)) ??
    [];
  const workerAlive =
    data?.health &&
    Date.now() - new Date(data.health.heartbeat).getTime() < 20000;
  const profileReady = !!data?.settings.profile.name;
  function field(key: string, value: string) {
    setEditing(true);
    setProfile({ ...profile, [key]: value });
  }
  const title = navigation.find((n) => n[0] === view)?.[1] ?? "Overview";
  return (
    <div className="desk">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Agent OS home">
          <span className="brand-icon">
            <Layers size={22} />
          </span>
          agent<span>os</span>
          <small>LOCAL / 01</small>
        </a>
        <div className="workspace">
          <span className="avatar">
            {data?.settings.profile.name?.charAt(0) ?? "Y"}
          </span>
          <div>
            <strong>
              {data?.settings.profile.name?.split(" ")[0] ?? "Your workspace"}
            </strong>
            <small>Personal opportunity desk</small>
          </div>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {navigation
            .filter((_, index) => more || index < 6)
            .map(([id, label, Icon]) => (
              <button
                key={id}
                className={view === id ? "nav-item active" : "nav-item"}
                onClick={() => {
                  setView(id);
                  setSelected(null);
                }}
              >
                <Icon size={18} />
                {label}
                {id === "decisions" && openCount > 0 && (
                  <span className="counter">{openCount}</span>
                )}
              </button>
            ))}
          <button
            className="nav-item"
            aria-expanded={more}
            onClick={() => setMore(!more)}
          >
            <Settings size={18} />
            {more ? "Less" : "More"}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <span
            className={
              workerAlive && !connectionLost ? "pulse" : "status-dot offline"
            }
          />
          <span>
            {connectionLost
              ? "Connection lost"
              : workerAlive
                ? "Worker connected"
                : "Worker offline"}
          </span>
          <small>v0.1 · private local edition</small>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <span>
            Workspace <ChevronRight size={14} /> <strong>{title}</strong>
          </span>
          <div>
            <span className="local-label">
              <ShieldCheck size={14} /> Local & private
            </span>
            <button
              className="icon-button"
              aria-label={`Decision inbox, ${openCount} open`}
              onClick={() => setView("decisions")}
            >
              <Bell size={18} />
              {openCount > 0 && <i />}
            </button>
          </div>
        </header>
        {data && (
          <div className="agent-strip" aria-label="Agent status">
            <span className="agent-strip-label">Your agents</span>
            {data.agents.map((agent: Row) => (
              <button
                key={agent.id}
                onClick={() => setView("agents")}
                aria-label={`${agent.name}, level ${agent.level} ${agent.label}, ${connectionLost ? "Connection lost" : agent.status}`}
              >
                <span
                  className={`status-dot ${connectionLost || ["Offline", "Paused", "Disabled"].includes(agent.status) ? "offline" : ["Needs attention", "Needs setup", "Daily limit", "Cooling down"].includes(agent.status) ? "waiting" : ""}`}
                />
                {agent.name}
                <span className="maturity-badge">
                  L{agent.level} · {agent.label}
                </span>
              </button>
            ))}
          </div>
        )}
        <main>
          <div className="page-heading">
            <div>
              <h1>{view === "overview" ? "Your desk" : title}</h1>
              <p>
                {view === "overview"
                  ? "Everything that needs you. The rest keeps moving."
                  : descriptions[view]}
              </p>
            </div>
            {view === "opportunities" ? (
              <button
                className="primary"
                onClick={() => setModal("opportunity")}
              >
                <Plus size={16} /> Add opportunity
              </button>
            ) : null}
          </div>
          {error && (
            <div role="alert" className="notice error">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="notice">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!data ? (
            <section className="panel empty">
              <RefreshCw size={30} />
              <h2>Connecting to your workspace</h2>
              <p>Run setup and start the worker to bring your desk online.</p>
              <button onClick={refresh}>Try again</button>
            </section>
          ) : (
            <>
              {view === "overview" && (
                <>
                  <section className="quiet-status">
                    <div>
                      <span
                        className={`status-dot ${!workerAlive || connectionLost || !data.settings.autopilot ? "offline" : ""}`}
                      />
                      <strong>
                        {connectionLost
                          ? "Connection lost"
                          : !workerAlive
                            ? "Worker is offline"
                            : !data.settings.autopilot
                              ? "Preparation is paused"
                              : "Automatic preparation is on"}
                      </strong>
                      <p>
                        {data.totals.queued} tasks waiting or running ·{" "}
                        {data.totals.drafts} drafts saved
                      </p>
                    </div>
                    <button
                      disabled={busy || connectionLost}
                      onClick={() =>
                        act(
                          {
                            action: "settings",
                            value: {
                              ...data.settings,
                              autopilot: !data.settings.autopilot,
                            },
                          },
                          data.settings.autopilot
                            ? "Preparation paused"
                            : "Preparation resumed",
                        )
                      }
                    >
                      {data.settings.autopilot ? (
                        <Pause size={15} />
                      ) : (
                        <Play size={15} />
                      )}
                      {data.settings.autopilot ? "Pause" : "Resume"}
                    </button>
                  </section>
                  {!profileReady && (
                    <section className="panel setup-prompt">
                      <h2>Start with your profile</h2>
                      <p>
                        Add your experience so agents can prepare truthful
                        drafts.
                      </p>
                      <button
                        className="primary"
                        onClick={() => setView("profile")}
                      >
                        Set up profile <ArrowRight size={16} />
                      </button>
                    </section>
                  )}
                  <section className="panel attention-panel">
                    <div className="section-title">
                      <h2>Blockers & review</h2>
                      <span className={`badge ${openCount ? "amber" : ""}`}>
                        {openCount} open
                      </span>
                    </div>
                    {open.length ? (
                      open.slice(0, 3).map((d: Row) => (
                        <button
                          className="decision-preview"
                          key={d.id}
                          onClick={() => setView("decisions")}
                        >
                          <Bell size={17} />
                          <div>
                            <strong>{d.title}</strong>
                            <small>
                              {d.kind === "workflow-failure"
                                ? "Workflow needs attention"
                                : d.kind === "submission"
                                  ? "Review draft · submit manually"
                                  : "Automatic review or blocker"}
                            </small>
                          </div>
                          <ChevronRight size={16} />
                        </button>
                      ))
                    ) : (
                      <p>
                        You’re caught up. New questions and manual steps appear
                        here.
                      </p>
                    )}
                    {openCount > 3 && (
                      <button
                        className="text-button"
                        onClick={() => setView("decisions")}
                      >
                        Open inbox · {openCount} items <ArrowRight size={14} />
                      </button>
                    )}
                  </section>
                  <section className="panel">
                    <div className="section-title">
                      <h2>Latest drafts</h2>
                      <button
                        className="text-button"
                        onClick={() => setView("content")}
                      >
                        All drafts <ArrowUpRight size={14} />
                      </button>
                    </div>
                    {data.artifacts.slice(0, 3).map((a: Row) => (
                      <button
                        key={a.id}
                        className="draft-preview"
                        onClick={() => {
                          setView("content");
                          setEditingArtifact(a);
                        }}
                      >
                        <FileText size={18} />
                        <span>{a.title}</span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    {!data.artifacts.length && (
                      <p>
                        Your drafts will appear after an opportunity is
                        prepared.
                      </p>
                    )}
                    <div className="home-links">
                      <button onClick={() => setView("opportunities")}>
                        Opportunities <ArrowRight size={14} />
                      </button>
                      {!data.sources.length && (
                        <button onClick={() => setView("connections")}>
                          Connect a source
                        </button>
                      )}
                    </div>
                  </section>
                  <p className="scope-note">
                    Agents prepare drafts. Sending, applications and profile
                    publishing remain manual.
                  </p>
                </>
              )}
              {view === "agents" && (
                <>
                  <div className="agent-grid">
                    {data.agents.map((agent: Row) => (
                      <section className="panel agent-card" key={agent.id}>
                        <div className="section-title">
                          <h2>{agent.name}</h2>
                          <span className="maturity-badge">
                            L{agent.level} · {agent.label}
                          </span>
                        </div>
                        <p>{agent.purpose}</p>
                        <span className="agent-state">
                          {connectionLost ? "Connection lost" : agent.status}
                        </span>
                        <progress
                          value={agent.progress}
                          max={agent.target}
                          aria-label={`${agent.name} maturity evidence`}
                        />
                        <p className="agent-evidence">{agent.detail}</p>
                        <small>{agent.next}</small>
                        <button
                          className="text-button"
                          onClick={() => {
                            setMore(true);
                            setView(agent.destination);
                          }}
                        >
                          View evidence <ArrowUpRight size={14} />
                        </button>
                      </section>
                    ))}
                  </div>
                  <section className="panel maturity-explanation">
                    <h2>Earned through work</h2>
                    <p>
                      Badges refresh every five seconds from saved evidence. L0:
                      no recent evidence. L1: observed work. L2: the latest 20
                      real runs completed without failures or retries, within 30
                      days. Samples never raise a badge. Recent setbacks or
                      expired evidence can lower it.
                    </p>
                    <p>
                      These are execution maturity levels, not measures of
                      intelligence or hiring success. Scout stays at L1 until
                      historical source evaluation exists. Outcome learning
                      currently collects observations; automatic strategy
                      improvement is not yet enabled.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => {
                        setMore(true);
                        setView("learning");
                      }}
                    >
                      View learning evidence <ArrowRight size={14} />
                    </button>
                  </section>
                </>
              )}
              {view === "opportunities" && (
                <>
                  <div className="toolbar">
                    <div className="tabs">
                      {["all", "job", "client"].map((x) => (
                        <button
                          className={filter === x ? "selected" : ""}
                          key={x}
                          onClick={() => setFilter(x)}
                        >
                          {x === "all"
                            ? "All opportunities"
                            : x === "job"
                              ? "Career"
                              : "Client projects"}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={busy}
                      onClick={() =>
                        act({ action: "demo" }, "Demo opportunities loaded")
                      }
                    >
                      Load demo
                    </button>
                  </div>
                  <div className="opportunity-grid">
                    {data.opportunities
                      .filter((o: Row) => filter === "all" || o.kind === filter)
                      .map((o: Row) => (
                        <section className="panel" key={o.id}>
                          <OpportunityCard
                            item={o}
                            busy={busy}
                            queue={() =>
                              act(
                                { action: "queue", id: o.id },
                                "Package queued",
                              )
                            }
                            select={() => setSelected(o)}
                          />
                          <p className="description">{o.description}</p>
                          <div className="card-footer">
                            <span>{o.source}</span>
                            {o.score !== null && (
                              <span>Skills fit {o.score}/100</span>
                            )}
                          </div>
                        </section>
                      ))}
                  </div>
                  {selected && (
                    <section className="panel detail">
                      <div className="section-title">
                        <h2>{selected.title}</h2>
                        <button
                          aria-label="Close details"
                          onClick={() => setSelected(null)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p>{selected.description}</p>
                      {selected.url && (
                        <a
                          href={selected.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open original opportunity <ArrowUpRight size={14} />
                        </a>
                      )}
                      <h3>Record the outcome</h3>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const values = new FormData(e.currentTarget);
                          await act(
                            {
                              action: "feedback",
                              value: {
                                id: selected.id,
                                outcome: values.get("outcome"),
                                note: values.get("note"),
                              },
                            },
                            "Outcome recorded. Sample opportunities are excluded from learning.",
                          );
                        }}
                      >
                        <div className="form-row">
                          <label>
                            Outcome
                            <select name="outcome">
                              <option value="replied">Replied</option>
                              <option value="interview">Interview</option>
                              <option value="rejected">Rejected</option>
                              <option value="won">Client won</option>
                              <option value="no_reply">No reply</option>
                            </select>
                          </label>
                          <label>
                            What actually happened?
                            <input
                              name="note"
                              placeholder="Use observations, not guesses"
                              maxLength={2000}
                            />
                          </label>
                        </div>
                        <button disabled={busy} type="submit">
                          Save outcome
                        </button>
                      </form>
                    </section>
                  )}
                </>
              )}
              {view === "decisions" && (
                <div className="stack">
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={showResolved}
                      onChange={(e) => setShowResolved(e.target.checked)}
                    />
                    Show answered items
                  </label>
                  {(showResolved
                    ? data.decisions.length === 0
                    : open.length === 0) && (
                    <Empty
                      icon={<Bell />}
                      title="You’re all caught up"
                      text="When a package is ready or a workflow needs your input, it will appear here."
                    />
                  )}
                  {data.decisions
                    .filter(
                      (d: Row) =>
                        showResolved || ["open", "blocked"].includes(d.status),
                    )
                    .map((d: Row) => (
                      <section className="panel" key={d.id}>
                        <div className="section-title">
                          <h2>{d.title}</h2>
                          <span
                            className={`badge ${["open", "blocked"].includes(d.status) ? "amber" : ""}`}
                          >
                            {d.status}
                          </span>
                        </div>
                        <details>
                          <summary>Original request</summary>
                          <p>{d.detail}</p>
                        </details>
                        {d.handled_by && (
                          <p className="panel-note">
                            Handled by {d.handled_by}.{" "}
                            {d.status === "blocked"
                              ? "Known context saved; remaining requirements are blocked. Other work continues."
                              : "Source-backed context assembled automatically."}
                          </p>
                        )}
                        {d.status === "open" ? (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const form = e.currentTarget;
                              const answer = new FormData(form).get("answer");
                              await act(
                                { action: "decision", id: d.id, answer },
                                "Answer recorded. No external action was performed.",
                              );
                            }}
                          >
                            <label>
                              Your answer
                              <textarea
                                name="answer"
                                required
                                maxLength={3000}
                                placeholder="Record your answer or review notes…"
                              />
                            </label>
                            <button className="primary" disabled={busy}>
                              Save answer
                            </button>
                          </form>
                        ) : (
                          <div>
                            {d.resolution && (
                              <p>
                                Remaining:{" "}
                                {[
                                  ...new Set(
                                    d.resolution.flatMap((r: Row) => r.gaps),
                                  ),
                                ].join(" · ") || "No missing supported topics"}
                              </p>
                            )}
                            <details>
                              <summary>
                                {d.resolution
                                  ? "Evidence prepared automatically"
                                  : "Blocker details"}
                              </summary>
                              <pre className="resolution-text">{d.answer}</pre>
                            </details>
                          </div>
                        )}
                      </section>
                    ))}
                </div>
              )}
              {view === "content" && (
                <>
                  <section className="panel">
                    <div className="section-title">
                      <div>
                        <h2>Let your work speak clearly.</h2>
                        <p>
                          Generate copy-ready profile content from the facts you
                          supplied.
                        </p>
                      </div>
                      <FileText size={28} />
                    </div>
                    <div className="platforms">
                      {["LinkedIn", "GitHub", "Upwork", "Portfolio"].map(
                        (p) => (
                          <button
                            key={p}
                            disabled={busy || !profileReady}
                            onClick={() =>
                              act(
                                { action: "presence", platform: p },
                                `${p} draft generated`,
                              )
                            }
                          >
                            {p}
                            <Plus size={16} />
                          </button>
                        ),
                      )}
                    </div>
                    <small>
                      Deterministic first draft · no invented claims · manual
                      publishing
                    </small>
                  </section>
                  <div className="content-grid">
                    {data.artifacts.map((a: Row) => (
                      <section className="panel" key={a.id}>
                        <span className="badge">
                          {a.kind === "package"
                            ? "Application package"
                            : a.kind === "ai-brief"
                              ? "AI opportunity brief"
                              : "Profile content"}
                        </span>
                        <h3>{a.title}</h3>
                        <small>{new Date(a.created_at).toLocaleString()}</small>
                        <details>
                          <summary>Read content</summary>
                          <pre>{a.content}</pre>
                        </details>
                        <a className="download" href={`/api/export?id=${a.id}`}>
                          <Download size={15} /> Download Markdown
                        </a>
                        <button
                          className="text-button"
                          onClick={() => setEditingArtifact({ ...a })}
                        >
                          Edit draft
                        </button>
                        {a.edited_at && <small> · Owner edited</small>}
                        {editingArtifact && editingArtifact.id === a.id && (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (
                                await act(
                                  {
                                    action: "artifact",
                                    id: a.id,
                                    content: editingArtifact.content,
                                  },
                                  "Draft updated; previous text retained",
                                )
                              )
                                setEditingArtifact(null);
                            }}
                          >
                            <label>
                              Edit draft text
                              <textarea
                                rows={15}
                                value={editingArtifact.content}
                                onChange={(e) =>
                                  setEditingArtifact({
                                    ...editingArtifact,
                                    content: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <button disabled={busy} className="primary">
                              Save draft
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingArtifact(null)}
                            >
                              Cancel
                            </button>
                          </form>
                        )}
                      </section>
                    ))}
                  </div>
                </>
              )}
              {view === "profile" && (
                <section className="panel profile-editor">
                  <div className="section-title">
                    <div>
                      <h2>The truth, well told.</h2>
                      <p>
                        Every draft starts here. Keep your experience accurate
                        and specific.
                      </p>
                    </div>
                    <span className="badge">Private to this machine</span>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        await act(
                          { action: "profile", value: profile },
                          "Profile saved",
                        )
                      )
                        setEditing(false);
                    }}
                  >
                    <div className="form-row">
                      <label>
                        Full name
                        <input
                          required
                          value={profile.name}
                          onChange={(e) => field("name", e.target.value)}
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          required
                          value={profile.email}
                          onChange={(e) => field("email", e.target.value)}
                        />
                      </label>
                    </div>
                    <label>
                      Professional headline
                      <input
                        required
                        value={profile.headline}
                        onChange={(e) => field("headline", e.target.value)}
                      />
                    </label>
                    <div className="form-row">
                      <label>
                        Location
                        <input
                          value={profile.location}
                          onChange={(e) => field("location", e.target.value)}
                        />
                      </label>
                      <label>
                        Portfolio URL
                        <input
                          type="url"
                          value={profile.website}
                          onChange={(e) => field("website", e.target.value)}
                        />
                      </label>
                    </div>
                    <label>
                      Professional summary
                      <textarea
                        required
                        rows={5}
                        value={profile.summary}
                        onChange={(e) => field("summary", e.target.value)}
                      />
                    </label>
                    <label>
                      Skills, separated by commas
                      <input
                        value={profile.skills.join(", ")}
                        onChange={(e) => {
                          setEditing(true);
                          setProfile({
                            ...profile,
                            skills: e.target.value
                              .split(",")
                              .map((x) => x.trim()),
                          });
                        }}
                      />
                    </label>
                    <label>
                      Evidence and achievements, one per line
                      <textarea
                        rows={6}
                        value={profile.evidence.join("\n")}
                        onChange={(e) => {
                          setEditing(true);
                          setProfile({
                            ...profile,
                            evidence: e.target.value.split("\n"),
                          });
                        }}
                      />
                    </label>
                    <label>
                      Source / provenance
                      <input
                        value={profile.source}
                        onChange={(e) => field("source", e.target.value)}
                      />
                    </label>
                    <button className="primary" disabled={busy}>
                      Save profile <Check size={16} />
                    </button>
                  </form>
                </section>
              )}
              {view === "learning" && (
                <>
                  <section className="panel">
                    <h2>Learn from evidence, not assumptions.</h2>
                    <p>
                      Real outcomes are grouped by source and country. Demo
                      activity is excluded. A rejection alone never tells us why
                      a resume was rejected.
                    </p>
                    <div className="metrics learning-metrics">
                      <div className="metric">
                        <span>Real outcome groups</span>
                        <strong>{data.learning.length}</strong>
                      </div>
                      <div className="metric">
                        <span>Automatic strategy changes</span>
                        <strong>0</strong>
                      </div>
                      <div className="metric">
                        <span>Minimum observation cohort</span>
                        <strong>30</strong>
                      </div>
                    </div>
                  </section>
                  {data.learning.length ? (
                    <section className="panel table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Source</th>
                            <th>Country</th>
                            <th>Outcome</th>
                            <th>Count</th>
                            <th>Interpretation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.learning.map((r: Row, i: number) => (
                            <tr key={i}>
                              <td>{r.source}</td>
                              <td>{r.country}</td>
                              <td>{r.outcome}</td>
                              <td>{r.count}</td>
                              <td>{r.interpretation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  ) : (
                    <Empty
                      icon={<Sparkles />}
                      title="Your evidence will grow here"
                      text="Add real opportunities and record outcomes. Controlled strategy experiments are planned; this release only reports observations."
                    />
                  )}
                </>
              )}
              {view === "activity" && (
                <>
                  <section className="panel">
                    <h2>Agents right now</h2>
                    <p>
                      Live state refreshes every five seconds. Paused or stale
                      workers do not count as active.
                    </p>
                    {data.activity.map((a: Row) => (
                      <div className="run" key={a.agent}>
                        <div className="section-title">
                          <strong>{a.agent}</strong>
                          <span className="badge">
                            {!workerAlive || connectionLost
                              ? "Offline"
                              : !data.settings.autopilot
                                ? "Paused"
                                : ["checking", "working"].includes(a.state) &&
                                    Date.now() -
                                      new Date(a.updated_at).getTime() >
                                      180000
                                  ? "Stale"
                                  : a.state}
                          </span>
                        </div>
                        <p>{a.task}</p>
                        <small>
                          Last update {new Date(a.updated_at).toLocaleString()}
                        </small>
                      </div>
                    ))}
                    {!data.activity.length && (
                      <p>Waiting for the worker’s first update.</p>
                    )}
                  </section>
                  <section className="panel audit-panel">
                    <h2>Audit trail</h2>
                    <p>
                      Latest 100 durable records. Local audit history is not
                      tamper-proof.
                    </p>
                    {data.audit.map((a: Row) => (
                      <details className="audit-entry" key={a.id}>
                        <summary>
                          {a.agent} · {a.action} · {a.status}{" "}
                          <small>
                            {new Date(a.created_at).toLocaleString()}
                          </small>
                        </summary>
                        <pre className="resolution-text">
                          {JSON.stringify(a.detail, null, 2)}
                        </pre>
                        <small>
                          Record {a.id}
                          {a.entity_id ? ` · Item ${a.entity_id}` : ""}
                        </small>
                      </details>
                    ))}
                  </section>
                  <div className="two-columns">
                    <section className="panel">
                      <h2>Workflow runs</h2>
                      <p>
                        Mode: {data.health?.detail?.mode ?? "starting"} · Local
                        concurrency:{" "}
                        {data.health?.detail?.package_concurrency ?? "—"} · AI
                        concurrency: 1
                      </p>
                      {data.runs.length === 0 && (
                        <p>
                          No runs yet. Prepare an opportunity package to get
                          started.
                        </p>
                      )}
                      {data.runs.map((r: Row) => (
                        <div className="run" key={r.id}>
                          <div className="section-title">
                            <strong>
                              {r.kind === "ai-brief" ? "Analyst" : "Preparer"} ·{" "}
                              {r.title ?? r.kind}
                            </strong>
                            <span
                              className={`badge ${r.status === "failed" ? "amber" : ""}`}
                            >
                              {r.status}
                            </span>
                          </div>
                          {r.steps.map((s: string) => (
                            <small key={s}>
                              <Check size={13} />
                              {s}
                            </small>
                          ))}
                          {r.error && <p>{r.error}</p>}
                          <small>
                            {new Date(r.created_at).toLocaleString()}
                          </small>
                        </div>
                      ))}
                    </section>
                    <section className="panel">
                      <h2>Workspace journal</h2>
                      {data.events.map((e: Row) => (
                        <div className="journal" key={e.id}>
                          <span className="journal-dot" />
                          <div>
                            <p>{e.message}</p>
                            <small>
                              {new Date(e.created_at).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </section>
                  </div>
                </>
              )}
              {view === "connections" && (
                <div className="stack">
                  <section className="panel">
                    <div className="section-title">
                      <h2>Live job-board sources</h2>
                      <span className="badge">Free public APIs</span>
                    </div>
                    <p>
                      Add a company’s Greenhouse board token or Lever site slug
                      from its careers URL. Enabled sources refresh every six
                      hours; matching new roles are prepared within your daily
                      limit.
                    </p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const values = Object.fromEntries(new FormData(form));
                        if (
                          await act(
                            { action: "source", value: values },
                            "Source added. The worker will sync it shortly.",
                          )
                        )
                          form.reset();
                      }}
                    >
                      <div className="form-row">
                        <label>
                          Provider
                          <select name="provider">
                            <option value="greenhouse">Greenhouse</option>
                            <option value="lever">Lever</option>
                          </select>
                        </label>
                        <label>
                          Board token / site slug
                          <input
                            name="slug"
                            required
                            pattern="[a-zA-Z0-9_-]{2,80}"
                            placeholder="Company’s public board identifier"
                          />
                        </label>
                      </div>
                      <div className="form-row">
                        <label>
                          Company name
                          <input name="company" required minLength={2} />
                        </label>
                        <label>
                          Title keywords, comma-separated
                          <input
                            name="keywords"
                            required
                            defaultValue="full stack,fullstack,frontend,technical lead"
                          />
                        </label>
                      </div>
                      <button disabled={busy}>Add source</button>
                    </form>
                    {data.sources.map((source: Row) => (
                      <div className="capability" key={source.id}>
                        <div>
                          <strong>{source.company}</strong>
                          <small style={{ display: "block" }}>
                            {source.provider}:{source.slug} ·{" "}
                            {source.last_sync
                              ? new Date(source.last_sync).toLocaleString()
                              : "Awaiting first sync"}
                          </small>
                          {source.sync_error && (
                            <small role="alert">{source.sync_error}</small>
                          )}
                        </div>
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(
                              {
                                action: "toggle-source",
                                id: source.id,
                                enabled: !source.enabled,
                              },
                              "Source updated",
                            )
                          }
                        >
                          {source.enabled ? "Pause" : "Enable"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(
                              { action: "sync", id: source.id },
                              "Source refreshed",
                            )
                          }
                        >
                          Sync now
                        </button>
                      </div>
                    ))}
                  </section>
                  <section className="panel">
                    <div className="section-title">
                      <h2>Composio</h2>
                      <span className="badge">
                        {data.integrations.composio
                          ? "Key configured"
                          : "Not configured"}
                      </span>
                    </div>
                    <p>
                      A private server-side key is configured through .env.
                      Account connections and permissions must be established
                      separately. A configured key alone does not mean Gmail or
                      job platforms are connected.
                    </p>
                    <div className="platforms">
                      <button disabled={busy} onClick={checkConnections}>
                        Verify connection
                      </button>
                      <button
                        disabled={busy || !data.integrations.composio}
                        onClick={() => connect("gmail")}
                      >
                        Connect Gmail
                      </button>
                      <button
                        disabled={busy || !data.integrations.composio}
                        onClick={() => connect("github")}
                      >
                        Connect GitHub
                      </button>
                    </div>
                    {connectionStatus && (
                      <p>
                        {connectionStatus.verified
                          ? "API key verified."
                          : "API key not configured."}{" "}
                        {connectionStatus.accounts.length} account(s) linked to
                        this workspace.{" "}
                        {connectionStatus.accounts
                          .map((a: Row) => `${a.toolkit}: ${a.status}`)
                          .join(" · ")}
                      </p>
                    )}
                    {connectUrl && (
                      <div className="notice">
                        <a
                          href={connectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Continue secure account connection ↗
                        </a>
                        <span>
                          Review the permissions shown by the provider.
                        </span>
                      </div>
                    )}
                    <a
                      href="https://platform.composio.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Composio dashboard <ArrowUpRight size={14} />
                    </a>
                  </section>
                  <section className="panel">
                    <h2>Execution capabilities</h2>
                    <div className="capability">
                      <span>Local draft preparation</span>
                      <span className="badge">Available</span>
                    </div>
                    <div className="capability">
                      <span>Official Codex CLI</span>
                      <span>Optional · configurable daily attempt cap</span>
                    </div>
                    <div className="capability">
                      <span>Gmail reading & sending</span>
                      <span>Not enabled</span>
                    </div>
                    <div className="capability">
                      <span>Browser application submission</span>
                      <span>Not enabled</span>
                    </div>
                    <div className="capability">
                      <span>Live profile publishing</span>
                      <span>Manual copy-ready content</span>
                    </div>
                  </section>
                </div>
              )}
              {view === "settings" && (
                <section className="panel settings-panel">
                  <h2>Keep the pace comfortable.</h2>
                  <p>
                    Autopilot currently covers local package preparation. These
                    controls never authorize sending messages or applications.
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      await act(
                        {
                          action: "settings",
                          value: {
                            autopilot: f.get("autopilot") === "on",
                            daily_limit: Number(f.get("limit")),
                            ai_assist: f.get("ai_assist") === "on",
                            execution_mode: f.get("execution_mode"),
                            ai_daily_limit: Number(f.get("ai_daily_limit")),
                          },
                        },
                        "Settings saved",
                      );
                    }}
                    key={`${data.settings.autopilot}-${data.settings.daily_limit}-${data.settings.execution_mode}-${data.settings.ai_daily_limit}-${data.settings.ai_assist}`}
                  >
                    <label className="check-label">
                      <input
                        name="autopilot"
                        type="checkbox"
                        defaultChecked={data.settings.autopilot}
                      />{" "}
                      Automatically process queued packages
                    </label>
                    <label className="check-label">
                      <input
                        name="ai_assist"
                        type="checkbox"
                        defaultChecked={data.settings.ai_assist}
                      />{" "}
                      AI-assisted briefs via your Codex login (daily cap below,
                      consumes subscription allowance)
                    </label>
                    <label>
                      Execution mode
                      <select
                        name="execution_mode"
                        defaultValue={data.settings.execution_mode}
                      >
                        <option value="balanced">
                          Balanced · one local preparation at a time
                        </option>
                        <option value="performance">
                          Performance · parallel local preparation
                        </option>
                      </select>
                    </label>
                    <label>
                      Daily AI attempt limit
                      <input
                        name="ai_daily_limit"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={data.settings.ai_daily_limit}
                      />
                    </label>
                    <p>
                      AI uses one account session at a time. Three recent
                      failures pause new AI attempts for up to 30 minutes.
                      Increasing this cap uses more of your subscription
                      allowance.
                    </p>
                    <label>
                      Daily package limit
                      <input
                        name="limit"
                        type="number"
                        min={1}
                        max={1000}
                        defaultValue={data.settings.daily_limit}
                      />
                    </label>
                    <button className="primary" disabled={busy}>
                      Save settings
                    </button>
                  </form>
                  <div className="panel-note">
                    Local, single-owner edition. Keep the server bound to
                    127.0.0.1. Hosted multi-user access is not supported in this
                    release.
                  </div>
                </section>
              )}
              <footer>
                <span>
                  <span className="pulse" />
                  {workerAlive
                    ? `${running.length} queued · worker online`
                    : "Worker offline · start npm run worker"}
                </span>
                <span>Built for momentum. Grounded in your facts.</span>
              </footer>
            </>
          )}
        </main>
      </div>
      {modal === "opportunity" && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add opportunity"
          >
            <div className="section-title">
              <h2>A new possibility.</h2>
              <button aria-label="Close dialog" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const value = Object.fromEntries(f);
                if (
                  await act(
                    { action: "opportunity", value },
                    "Opportunity added",
                  )
                )
                  setModal(null);
              }}
            >
              <div className="form-row">
                <label>
                  Type
                  <select name="kind">
                    <option value="job">Career opportunity</option>
                    <option value="client">Client project</option>
                  </select>
                </label>
                <label>
                  Country / region
                  <input
                    name="country"
                    required
                    placeholder="Remote, India, UAE…"
                  />
                </label>
              </div>
              <label>
                Role or project title
                <input name="title" required minLength={3} />
              </label>
              <div className="form-row">
                <label>
                  Company
                  <input name="company" required minLength={2} />
                </label>
                <label>
                  Source
                  <input
                    name="source"
                    required
                    placeholder="Company careers page"
                  />
                </label>
              </div>
              <label>
                Original URL
                <input name="url" type="url" placeholder="https://…" />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  minLength={30}
                  maxLength={15000}
                  required
                  rows={5}
                  placeholder="Paste the role or project requirements (at least 30 characters)."
                />
              </label>
              <button className="primary" disabled={busy}>
                Add to pipeline <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function OpportunityCard({
  item,
  busy,
  queue,
  select,
}: {
  item: Row;
  busy: boolean;
  queue: () => void;
  select: () => void;
}) {
  return (
    <div className="op-card">
      <div className="company-icon">{item.company.slice(0, 1)}</div>
      <div className="op-main">
        <button className="title-button" onClick={select}>
          {item.title}
        </button>
        <small>
          {item.company} · {item.country}
        </small>
        <div className="tags">
          <span className="badge">
            {item.kind === "job" ? "Career" : "Client"}
          </span>
          {item.sample && <span className="badge neutral">Demo</span>}
          <span className="status-text">{item.status}</span>
        </div>
      </div>
      <button
        className="prepare"
        disabled={busy}
        onClick={queue}
        aria-label={`Prepare ${item.title}`}
      >
        <ArrowRight size={17} />
      </button>
    </div>
  );
}
function Empty({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <section className="panel empty">
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
const descriptions: Record<string, string> = {
  agents: "What your agents are doing, and how each level is earned.",
  opportunities: "A focused pipeline for the work you want to do.",
  decisions: "Clear questions, thoughtful answers, and no silent approvals.",
  content: "Your experience, shaped into useful drafts.",
  profile: "The source of truth behind every opportunity.",
  learning: "Understand which sources are leading to real conversations.",
  activity: "A transparent record of what your workspace has done.",
  connections: "Know what is connected, available, and still to be set up.",
  settings: "Set the boundaries. Keep control of the pace.",
};
