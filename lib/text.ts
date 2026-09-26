/** Extract only the outward-facing note, never internal evidence or audit metadata. */
export function draftMessage(content: string) {
  const match = content.match(
    /^## (?:Suggested cover note|Cover note|Proposal introduction)\s*\n([\s\S]*?)(?=\n## |\nAI-assisted draft\.|$)/m,
  );
  return match?.[1]?.trim() ?? "";
}
