import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axiom — Think Deeper",
  description: "Axiom is an autonomous multi-agent research engine. It reads the internet, connects the dots, and writes the report you were going to spend three days on.",
  keywords: ["AI research", "autonomous agents", "literature review", "Gemini", "multi-agent"],
  openGraph: {
    title: "Axiom — Think Deeper",
    description: "Multi-agent synthesis engine. Research done in minutes, not days.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          Display:  Syne — geometric, distinctive, engineered confidence
          Body:     DM Sans — warm, highly legible, modern editorial
          Terminal: JetBrains Mono — technical precision
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
