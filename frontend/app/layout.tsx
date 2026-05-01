import type { Metadata } from "next";
import "./fonts.css";
import "./main.css";

export const metadata: Metadata = {
  title: "Axiom — Research Intelligence",
  description:
    "Autonomous multi-agent research synthesis. From question to structured report in minutes.",
  openGraph: {
    title:       "Axiom — Research Intelligence",
    description: "Autonomous multi-agent research synthesis.",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          UI / Brand:  Plus Jakarta Sans — clean, confident, professional SaaS standard
          Report body: Lora              — scholarly serif (Nature, Springer, HBR)
          Terminal:    Geist Mono        — modern, neutral, easy at small sizes
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Geist+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
