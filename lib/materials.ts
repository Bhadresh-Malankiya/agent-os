import PDFDocument from "pdfkit";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ProfileSchema, type Profile } from "./domain";

export async function resumePdf(input: unknown) {
  const profile = ProfileSchema.parse(input);
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: { Title: `${profile.name} — résumé`, Author: profile.name },
  });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.font(
    await readFile(
      resolve(
        process.cwd(),
        "node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff",
      ),
    ),
  );
  const para = (text: string, size = 10) => {
    doc.fontSize(size).fillColor("#263c33").text(text, { lineGap: 3 });
    doc.moveDown(0.55);
  };
  const section = (title: string, items: string[]) => {
    if (!items.length) return;
    if (doc.y > 700) doc.addPage();
    doc.moveDown(0.5);
    para(title.toUpperCase(), 11);
    items.forEach((v) => para(v));
  };
  para(profile.name, 22);
  para(profile.headline, 12);
  para(
    [profile.email, profile.location, profile.website]
      .filter(Boolean)
      .join(" · "),
    9,
  );
  section("Profile", [profile.summary]);
  section("Skills", [profile.skills.join(" · ")]);
  section("Experience", profile.experience ?? []);
  section("Projects", profile.projects ?? []);
  section("Selected evidence", profile.evidence);
  doc.end();
  return result;
}
export function emailFile(
  w: { recipient: string; title: string; body: string },
  pdf: Buffer,
) {
  const b64 = (value: Buffer | string) =>
    Buffer.from(value)
      .toString("base64")
      .match(/.{1,76}/g)
      ?.join("\r\n") ?? "";
  const boundary = "AgentOS_Multipart_Resume";
  return [
    "MIME-Version: 1.0",
    "X-Unsent: 1",
    `To: ${w.recipient}`,
    `Subject: =?UTF-8?B?${Buffer.from(w.title.replace(/[\r\n]/g, " ")).toString("base64")}?=`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(w.body),
    `--${boundary}`,
    'Content-Type: application/pdf; name="resume.pdf"',
    'Content-Disposition: attachment; filename="resume.pdf"',
    "Content-Transfer-Encoding: base64",
    "",
    b64(pdf),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}
