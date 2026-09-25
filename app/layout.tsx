import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Agent OS — Your opportunity desk",
  description: "A private operating desk for career and client opportunities.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
