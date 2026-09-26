"use client";
import { useState, useEffect, useRef } from "react";
import { emailLinks } from "@/lib/email-links";
type Row = Record<string, any>;
export function BatchPanel({
  data,
  busy,
  send,
}: {
  data: Row;
  busy: boolean;
  send: (v: Row) => Promise<any>;
}) {
  const last = data.batches?.[0];
  return (
    <section className="batch-panel os-card">
      <div className="os-section-head">
        <div>
          <span className="os-step">AUTOMATIC BATCHES</span>
          <h2>
            {last?.status === "running"
              ? "Finding your next opportunities"
              : data.settings.autopilot
                ? "Your next batch is scheduled"
                : "Batches paused"}
          </h2>
          <p>
            {data.settings.autopilot
              ? `Next: ${new Date(data.settings.next_batch_at).toLocaleString()}`
              : "Resume agents to continue."}{" "}
            · {data.sources.filter((s: Row) => s.enabled).length} sources
          </p>
        </div>
        <button
          className="os-primary"
          disabled={
            busy || !data.settings.autopilot || last?.status === "running"
          }
          onClick={() => send({ action: "run-batch" })}
        >
          Run batch now
        </button>
      </div>
      <details>
        <summary>Schedule & last result</summary>
        <form
          className="os-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget);
            send({
              action: "schedule",
              minutes: Number(v.get("minutes")),
              clients: v.get("clients") === "on",
            });
          }}
        >
          <label>
            Run every{" "}
            <select name="minutes" defaultValue={data.settings.batch_minutes}>
              {[
                [60, "hour"],
                [180, "3 hours"],
                [360, "6 hours"],
                [720, "12 hours"],
                [1440, "day"],
              ].map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="os-check">
            <input
              name="clients"
              type="checkbox"
              defaultChecked={data.settings.client_prospecting}
            />
            Include client prospecting signals
          </label>
          <button disabled={busy}>Save schedule</button>
        </form>
        {last ? (
          <p>
            {last.status.replaceAll("_", " ")} · {last.sources_checked} sources
            · {last.leads_added} new leads · {last.packages_queued} packages
            queued · {last.drafts_created} drafts created during batch
          </p>
        ) : (
          <p>No completed batch yet.</p>
        )}
        {last?.errors?.map((e: string, i: number) => (
          <p className="os-blocker" key={i}>
            {e}
          </p>
        ))}
        <small>
          Sources run on schedule; draft preparation continues afterward. Daily
          limits still apply. Client signals show hiring activity, not verified
          contracts.
        </small>
      </details>
    </section>
  );
}
function DraftCard({
  w,
  lead,
  connected,
  busy,
  send,
}: {
  w: Row;
  lead?: Row;
  connected: boolean;
  busy: boolean;
  send: (v: Row) => Promise<any>;
}) {
  const [recipient, setRecipient] = useState(w.recipient),
    [title, setTitle] = useState(w.title),
    [body, setBody] = useState(w.body),
    [mark, setMark] = useState(false),
    [baseHash, setBaseHash] = useState(w.payload_hash);
  const edited = useRef(false);
  useEffect(() => {
    if (!edited.current) {
      setRecipient(w.recipient);
      setTitle(w.title);
      setBody(w.body);
      setBaseHash(w.payload_hash);
    }
  }, [w.recipient, w.title, w.body, w.payload_hash]);
  const dirty =
    recipient !== w.recipient || title !== w.title || body !== w.body;
  let links;
  try {
    links = emailLinks(recipient, title, body);
  } catch {}
  return (
    <details className="os-card draft-row">
      <summary>
        <span>
          <strong>{lead?.company ?? w.title}</strong>
          <small>
            {lead?.title ?? w.title} · {w.recipient || "Add recipient"}
            {lead?.kind === "client" ? " · Client prospect" : ""}
          </small>
        </span>
        <span className="tag">
          {w.status === "manual_sent" ? "Sent by you" : w.status}
        </span>
      </summary>
      <div className="draft-editor">
        <p>
          {w.status === "draft"
            ? "Review the message and use your preferred email app. Opening a draft does not send it."
            : w.status === "manual_sent"
              ? "You recorded this as sent outside Agent OS. Delivery is not verified."
              : (w.error ?? "Provider status is shown below.")}
        </p>
        <label>
          Recipient
          <input
            aria-label="Draft recipient"
            type="email"
            value={recipient}
            onChange={(e) => {
              edited.current = true;
              setRecipient(e.target.value);
            }}
            disabled={w.status !== "draft"}
            placeholder="Verified contact email — never guessed"
          />
        </label>
        <label>
          Subject
          <input
            value={title}
            onChange={(e) => {
              edited.current = true;
              setTitle(e.target.value);
            }}
            maxLength={180}
            disabled={w.status !== "draft"}
          />
        </label>
        <label>
          Message
          <textarea
            value={body}
            onChange={(e) => {
              edited.current = true;
              setBody(e.target.value);
            }}
            rows={7}
            maxLength={10000}
            disabled={w.status !== "draft"}
          />
        </label>
        {dirty && (
          <button
            className="os-primary"
            disabled={busy}
            onClick={async () => {
              const result = await send({
                action: "edit-work",
                id: w.id,
                hash: baseHash,
                value: { ...w, recipient, title, body },
              });
              if (result) {
                edited.current = false;
                setBaseHash(result.hash);
              }
            }}
          >
            Save changes
          </button>
        )}
        {dirty && (
          <button
            onClick={() => {
              edited.current = false;
              setRecipient(w.recipient);
              setTitle(w.title);
              setBody(w.body);
              setBaseHash(w.payload_hash);
            }}
          >
            Discard edits & reload saved draft
          </button>
        )}
        {w.suppressed && (
          <p className="os-blocker">
            This contact is suppressed. Email handoff is disabled.
          </p>
        )}
        <div className="os-actions">
          {w.status === "draft" && !w.suppressed && links && (
            <>
              {links.mailto.length < 2000 ? (
                <a href={links.mailto}>Open email app ↗</a>
              ) : (
                <small>
                  Long message: use the email file download to keep the full
                  text.
                </small>
              )}
              {links.gmail.length < 8000 && (
                <a href={links.gmail} target="_blank" rel="noreferrer">
                  Open Gmail draft ↗
                </a>
              )}
            </>
          )}
          {lead?.url && (
            <a href={lead.url} target="_blank" rel="noreferrer">
              {lead.kind === "client" ? "Verify source" : "Application page"} ↗
            </a>
          )}
        </div>
        <div className="os-actions">
          <a href="/api/materials?format=resume">Résumé PDF ↓</a>
          {!dirty && (
            <>
              <a href={`/api/materials?format=message&id=${w.id}`}>
                Cover note ↓
              </a>
              <a href={`/api/materials?format=eml&id=${w.id}`}>
                Email + résumé (.eml) ↓
              </a>
            </>
          )}
        </div>
        <small>
          PDF uses your saved profile. Email links do not attach files; attach
          the PDF manually or import the .eml file. Save edits before
          downloading.
        </small>
        {w.status === "draft" && (
          <div className="os-actions">
            <button
              disabled={busy || dirty || !recipient || !connected}
              onClick={() =>
                send({ action: "approve-work", id: w.id, hash: w.payload_hash })
              }
            >
              Approve connected send
            </button>
            <button
              disabled={busy || dirty || !recipient}
              onClick={() => setMark(true)}
            >
              I sent this myself
            </button>
            {w.recipient && !w.suppressed && (
              <button
                disabled={busy}
                onClick={() => send({ action: "suppress", email: w.recipient })}
              >
                Stop contacting recipient
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => send({ action: "cancel-work", id: w.id })}
            >
              Archive draft
            </button>
          </div>
        )}
        {!connected && w.status === "draft" && (
          <small>
            Email connection is optional for manual outreach. Connected sends
            require Gmail access and outreach mode.
          </small>
        )}
        {mark && (
          <div className="os-blocker">
            <p>
              Confirm you sent this exact saved message to {w.recipient}. This
              only updates your tracker.
            </p>
            <button
              disabled={busy}
              onClick={async () => {
                await send({
                  action: "manual-sent",
                  id: w.id,
                  hash: w.payload_hash,
                });
                setMark(false);
              }}
            >
              Confirm sent outside Agent OS
            </button>
            <button onClick={() => setMark(false)}>Keep as draft</button>
          </div>
        )}
      </div>
    </details>
  );
}
export function OutreachQueue({
  data,
  caps,
  busy,
  send,
}: {
  data: Row;
  caps: Row | null;
  busy: boolean;
  send: (v: Row) => Promise<any>;
}) {
  const [filter, setFilter] = useState("draft"),
    [search, setSearch] = useState(""),
    [limit, setLimit] = useState(15);
  const rows = data.work.filter(
    (w: Row) =>
      w.kind !== "meeting" &&
      (filter === "all" || w.status === filter) &&
      `${w.title} ${w.recipient}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="os-toolbar">
        <input
          aria-label="Search drafts"
          placeholder="Search drafts"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setLimit(15);
          }}
        />
        <select
          aria-label="Draft status"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setLimit(15);
          }}
        >
          <option value="draft">Ready for review</option>
          <option value="manual_sent">Sent by me</option>
          <option value="sent">Sent via connection</option>
          <option value="all">All drafts</option>
        </select>
        <span>{rows.length} drafts</span>
      </div>
      {rows.slice(0, limit).map((w: Row) => (
        <DraftCard
          key={w.id}
          w={w}
          lead={data.opportunities.find((o: Row) => o.id === w.opportunity_id)}
          connected={
            !!caps?.outreach && data.settings.workspace_mode === "outreach"
          }
          busy={busy}
          send={send}
        />
      ))}
      {rows.length > limit && (
        <button onClick={() => setLimit(limit + 15)}>Show more drafts</button>
      )}
      {!rows.length && (
        <section className="os-card">
          <h2>No drafts in this view</h2>
          <p>
            Run a batch after saving your profile. New prepared leads become
            editable email drafts automatically.
          </p>
        </section>
      )}
    </>
  );
}
