import { z } from "zod";
export function emailLinks(recipient: string, title: string, body: string) {
  const to = recipient.trim();
  if (to && !z.email().safeParse(to).success)
    throw new Error("Enter a valid recipient email.");
  const subject = title.replace(/[\r\n]/g, " ").slice(0, 180);
  const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return {
    mailto: `mailto:${encodeURIComponent(to)}?${qs}`,
    gmail: `https://mail.google.com/mail/?${new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body })}`,
  };
}
