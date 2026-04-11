"use client";
import { useMemo } from "react";

interface TocItem { level: 2 | 3; text: string; id: string; }

function slugify(t: string) {
  return String(t).toLowerCase().replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"-");
}

function extractToc(md: string): TocItem[] {
  return md.split("\n").reduce<TocItem[]>((acc, line) => {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2) acc.push({ level: 2, text: h2[1].trim(), id: slugify(h2[1]) });
    else if (h3) acc.push({ level: 3, text: h3[1].trim(), id: slugify(h3[1]) });
    return acc;
  }, []);
}

export default function TableOfContents({ markdown }: { markdown: string }) {
  const items = useMemo(() => extractToc(markdown), [markdown]);
  if (items.length < 2) return null;
  return (
    <nav className="toc not-prose" aria-label="Table of contents">
      <p className="toc-label">Contents</p>
      {items.map((item, i) => (
        <a key={i} href={`#${item.id}`} className={item.level === 3 ? "sub" : ""}>
          {item.text}
        </a>
      ))}
    </nav>
  );
}
