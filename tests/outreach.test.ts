import { test } from "node:test";
import assert from "node:assert/strict";
import { emailLinks } from "../lib/email-links";
import { emailFile } from "../lib/materials";
test("email handoff preserves text and cannot inject URI headers", () => {
  const text = "Hello team,\nA & B + C? résumé";
  const links = emailLinks("owner@example.com", "Hello & role", text);
  const url = new URL(links.gmail);
  assert.equal(url.searchParams.get("body"), text);
  assert.equal(url.searchParams.get("to"), "owner@example.com");
  assert.ok(links.mailto.includes("Hello%20team"));
  assert.ok(!links.mailto.includes("body=Hello+team"));
  assert.throws(() =>
    emailLinks("x@example.com\r\nBcc:y@example.com", "Test", text),
  );
  assert.equal(
    new URL(emailLinks("", "Test", "Body").gmail).searchParams.get("to"),
    "",
  );
});
test("downloadable email stays unsent and contains a MIME attachment", () => {
  const result = emailFile(
    {
      recipient: "owner@example.com",
      title: "Résumé\r\nX-Test: hi",
      body: "Saved message",
    },
    Buffer.from("%PDF-1.7 test"),
  );
  assert.match(result, /X-Unsent: 1/);
  assert.match(result, /filename="resume.pdf"/);
  assert.ok(result.includes(Buffer.from("Saved message").toString("base64")));
  assert.ok(!result.includes("\r\nX-Test:"));
});
