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
  ["overview", "Overview", Compass],
  ["opportunities", "Opportunities", BriefcaseBusiness],
  ["decisions", "Decision inbox", Bell],
  ["content", "Content studio", FileText],
  ["profile", "Your profile", User],
  ["learning", "Learning", Sparkles],
  ["activity", "Activity", Activity],
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
  const [error, setError] = useState("");
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
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection lost");
    }
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);
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
  const open = data?.decisions.filter((d: Row) => d.status === "open") ?? [];
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
          {navigation.map(([id, label, Icon]) => (
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
              {id === "decisions" && open.length > 0 && (
                <span className="counter">{open.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="pulse" />
          <span>{workerAlive ? "Worker connected" : "Worker offline"}</span>
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
              aria-label={`Decision inbox, ${open.length} open`}
              onClick={() => setView("decisions")}
            >
              <Bell size={18} />
              {open.length > 0 && <i />}
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR NEXT CHAPTER, IN MOTION</div>
              <h1>
                {view === "overview" ? "Make room for what’s next." : title}
              </h1>
              <p>
                {view === "overview"
                  ? "One calm place for your next role, your next client, and the work in between."
                  : descriptions[view]}
              </p>
            </div>
            {view === "overview" || view === "opportunities" ? (
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
                  <section className="hero">
                    <div>
                      <div className="hero-tag">
                        <span className="pulse" />{" "}
                        {data.settings.autopilot
                          ? "LOCAL PREPARATION ON"
                          : "PREPARATION PAUSED"}
                      </div>
                      <h2>
                        Your ambition.
                        <br />A little more organized.
                      </h2>
                      <p>
                        {profileReady
                          ? `Your profile is ready, ${data.settings.profile.name.split(" ")[0]}. Add a role or project and your worker will prepare a fact-based package.`
                          : "Start with your profile. Your experience becomes the foundation for every draft and decision."}
                      </p>
                      <button
                        className="light-button"
                        onClick={() =>
                          setView(profileReady ? "opportunities" : "profile")
                        }
                      >
                        {profileReady
                          ? "Explore your pipeline"
                          : "Set up your profile"}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                    <div className="orbit" aria-hidden="true">
                      <div className="orbit-ring ring1" />
                      <div className="orbit-ring ring2" />
                      <div className="orbit-center">
                        <Layers size={38} />
                      </div>
                      <span className="orbit-dot dot1">
                        <BriefcaseBusiness size={20} />
                      </span>
                      <span className="orbit-dot dot2">
                        <FileText size={20} />
                      </span>
                      <span className="orbit-dot dot3">
                        <Check size={20} />
                      </span>
                      <small>DISCOVER · PREPARE · REVIEW</small>
                    </div>
                  </section>
                  <div className="metrics">
                    {[
                      [
                        "In your pipeline",
                        data.opportunities.length,
                        "Roles & client projects",
                      ],
                      [
                        "Packages prepared",
                        prepared.length,
                        "Drafts ready for review",
                      ],
                      [
                        "Needs your input",
                        open.length,
                        "Decisions kept in one place",
                      ],
                      [
                        "AI briefs",
                        data.artifacts.filter((a: Row) => a.kind === "ai-brief")
                          .length,
                        "Subscription usage · API spend $0",
                      ],
                    ].map(([label, value, detail]) => (
                      <section className="metric" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <small>{detail}</small>
                      </section>
                    ))}
                  </div>
                  <div className="two-columns">
                    <section className="panel">
                      <div className="section-title">
                        <h2>Your next moves</h2>
                        <button
                          className="text-button"
                          onClick={() => setView("opportunities")}
                        >
                          View all <ArrowUpRight size={14} />
                        </button>
                      </div>
                      {data.opportunities.length ? (
                        data.opportunities.slice(0, 3).map((o: Row) => (
                          <OpportunityCard
                            key={o.id}
                            item={o}
                            busy={busy}
                            queue={() =>
                              act(
                                { action: "queue", id: o.id },
                                "Package queued — the worker will prepare it shortly.",
                              )
                            }
                            select={() => {
                              setView("opportunities");
                              setSelected(o);
                            }}
                          />
                        ))
                      ) : (
                        <div className="empty">
                          <BriefcaseBusiness size={28} />
                          <h3>A fresh start, with direction.</h3>
                          <p>
                            Add a real opportunity, or explore with clearly
                            labeled sample data.
                          </p>
                          <button
                            disabled={busy}
                            onClick={() =>
                              act(
                                { action: "demo" },
                                "Sample opportunities added. These are not real vacancies.",
                              )
                            }
                          >
                            Load demo opportunities
                          </button>
                        </div>
                      )}
                    </section>
                    <section className="panel">
                      <div className="section-title">
                        <h2>Only when you’re needed</h2>
                        <span className="badge amber">{open.length} open</span>
                      </div>
                      {open.length ? (
                        open.slice(0, 3).map((d: Row) => (
                          <button
                            className="decision-preview"
                            key={d.id}
                            onClick={() => setView("decisions")}
                          >
                            <span className="decision-icon">
                              <Bell size={17} />
                            </span>
                            <div>
                              <strong>{d.title}</strong>
                              <small>Review package · no message sent</small>
                            </div>
                            <ChevronRight size={16} />
                          </button>
                        ))
                      ) : (
                        <div className="empty compact">
                          <Check size={26} />
                          <h3>No open decisions</h3>
                          <p>
                            Questions and manual steps will appear here. Silence
                            never counts as approval.
                          </p>
                        </div>
                      )}
                      <div className="panel-note">
                        <ShieldCheck size={16} /> This release prepares content
                        locally. Live submissions and autonomous outreach are
                        not enabled.
                      </div>
                    </section>
                  </div>
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
                  {data.decisions.length === 0 && (
                    <Empty
                      icon={<Bell />}
                      title="You’re all caught up"
                      text="When a package is ready or a workflow needs your input, it will appear here."
                    />
                  )}
                  {data.decisions.map((d: Row) => (
                    <section className="panel" key={d.id}>
                      <div className="section-title">
                        <h2>{d.title}</h2>
                        <span
                          className={`badge ${d.status === "open" ? "amber" : ""}`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <p>{d.detail}</p>
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
                        <blockquote>{d.answer}</blockquote>
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
                          <strong>{r.title}</strong>
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
                        <small>{new Date(r.created_at).toLocaleString()}</small>
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
  opportunities: "A focused pipeline for the work you want to do.",
  decisions: "Clear questions, thoughtful answers, and no silent approvals.",
  content: "Your experience, shaped into useful drafts.",
  profile: "The source of truth behind every opportunity.",
  learning: "Understand which sources are leading to real conversations.",
  activity: "A transparent record of what your workspace has done.",
  connections: "Know what is connected, available, and still to be set up.",
  settings: "Set the boundaries. Keep control of the pace.",
};
