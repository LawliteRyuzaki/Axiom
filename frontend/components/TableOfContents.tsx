"use client";
import { useMemo } from "react";

interface TocItem { level: 2 | 3; text: string; id: string; }
const slug = (t: string) => String(t).toLowerCase().replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"-");
const extract = (md: string): TocItem[] => md.split("\n").reduce<TocItem[]>((acc, l) => {
  const h2 = l.match(/^##\s+(.+)/), h3 = l.match(/^###\s+(.+)/);
  if (h2) acc.push({ level: 2, text: h2[1].trim(), id: slug(h2[1]) });
  else if (h3) acc.push({ level: 3, text: h3[1].trim(), id: slug(h3[1]) });
  return acc;
}, []);

export default function TableOfContents({ markdown }: { markdown: string }) {
  const items = useMemo(() => extract(markdown), [markdown]);
  if (items.length < 2) return null;
  return (
    <nav className="toc" aria-label="Table of contents">
      <p className="toc-label">Contents</p>
      {items.map((it, i) => (
        <a key={i} href={`#${it.id}`} className={it.level === 3 ? "sub" : ""}>{it.text}</a>
      ))}
    </nav>
  );
}
