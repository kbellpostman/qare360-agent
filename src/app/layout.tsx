import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QARE 360° — Research Planner",
  description:
    "AI-assisted research planning for market research — shape your approach, timeline and indicative investment.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
