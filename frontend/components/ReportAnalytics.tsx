"use client";
import { useMemo } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import type { ResearchState } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countCitations(text: string): number {
  // Matches [1], [2], [12] style inline citations
  const inline = (text.match(/\[\d+\]/g) || []).length;
  // Matches numbered reference lines like "1. Title — Source"
  const refLines = (text.match(/^\[\d+\]/gm) || []).length;
  return Math.max(inline, refLines);
}

function extractSourceTypes(text: string): { name: string; count: number }[] {
  const urls = text.match(/https?:\/\/[^\s)>\]"]+/g) || [];
  const counts: Record<string, number> = {
    Academic: 0,
    News: 0,
    Official: 0,
    Technical: 0,
    Other: 0,
  };
  const academic = /arxiv|scholar|pubmed|ieee|acm|springer|researchgate|academia/i;
  const news = /bbc|cnn|reuters|guardian|nytimes|theverge|wired|techcrunch/i;
  const official = /\.gov|\.edu|who\.int|un\.org|europa\.eu/i;
  const technical = /github|stackoverflow|docs\.|developer\.|medium\.com|towardsdatascience/i;

  urls.forEach((url) => {
    if (academic.test(url)) counts.Academic++;
    else if (news.test(url)) counts.News++;
    else if (official.test(url)) counts.Official++;
    else if (technical.test(url)) counts.Technical++;
    else counts.Other++;
  });

  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, count]) => ({ name, count }));
}

function scoreTopicCoverage(text: string, queries: string[]): { topic: string; score: number }[] {
  const lower = text.toLowerCase();
  const topics = [
    {
      topic: "Foundations",
      keywords: ["introduction", "background", "theory", "concept", "definition", "overview", "fundamental"],
    },
    {
      topic: "Recent Advances",
      keywords: ["2024", "2025", "2026", "recent", "latest", "new", "state-of-the-art", "breakthrough"],
    },
    {
      topic: "Applications",
      keywords: ["application", "use case", "real-world", "industry", "deployment", "practice", "implementation"],
    },
    {
      topic: "Challenges",
      keywords: ["limitation", "challenge", "problem", "issue", "drawback", "constraint", "difficulty"],
    },
    {
      topic: "Future Outlook",
      keywords: ["future", "direction", "trend", "outlook", "prediction", "recommendation", "emerging"],
    },
  ];

  const wordCount = countWords(text);
  return topics.map(({ topic, keywords }) => {
    const hits = keywords.reduce((acc, kw) => {
      const re = new RegExp(`\\b${kw}`, "gi");
      return acc + (lower.match(re) || []).length;
    }, 0);
    // Normalise: more hits per 1000 words = higher score, cap at 100
    const rawScore = Math.min(100, Math.round((hits / Math.max(wordCount, 1)) * 1000 * 8));
    // Ensure minimum score of 20 if any keyword found at all
    return { topic, score: hits > 0 ? Math.max(20, rawScore) : 0 };
  });
}

function buildAgentTimeline(duration: number | null, queries: string[]) {
  if (!duration) return [];
  // Estimate phase split based on observed Axiom behaviour:
  // Scout ≈ 15%, each search ≈ 50% total, Writer ≈ 35%
  const scoutTime = Math.round(duration * 0.15);
  const searchTime = Math.round(duration * 0.50);
  const writerTime = duration - scoutTime - searchTime;
  return [
    { phase: "Scout", seconds: scoutTime, color: "#C41E3A" },
    { phase: "Searcher", seconds: searchTime, color: "#d6b656" },
    { phase: "Writer", seconds: writerTime, color: "#3FB950" },
  ];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 0,
      }}
    >
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.6rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-faint)",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "var(--font-ui)",
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "var(--accent)",
        lineHeight: 1,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "var(--text-faint)",
        }}>
          {sub}
        </span>
      )}
    </motion.div>
  );
}

const SOURCE_COLORS: Record<string, string> = {
  Academic: "#3FB950",
  News: "#58A6FF",
  Official: "#C41E3A",
  Technical: "#d6b656",
  Other: "#8B949E",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--term-bg)",
      border: "1px solid #21262D",
      borderRadius: "var(--radius)",
      padding: "8px 12px",
      fontFamily: "var(--font-mono)",
      fontSize: "0.75rem",
      color: "var(--term-bright)",
    }}>
      <div style={{ color: "var(--text-faint)", marginBottom: 2 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || "var(--accent)" }}>
          {p.name}: <strong>{p.value}{p.name === "seconds" ? "s" : ""}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  state: ResearchState;
}

export default function ReportAnalytics({ state }: Props) {
  const { report, duration, queries, status, partial } = state;

  const isDone = status === "completed" || status === "partial";
  if (!isDone || !report || report.length < 100) return null;

  // Compute all analytics
  const wordCount   = useMemo(() => countWords(report), [report]);
  const citations   = useMemo(() => countCitations(report), [report]);
  const readingMins = useMemo(() => Math.max(1, Math.round(wordCount / 200)), [wordCount]);
  const sourceData  = useMemo(() => extractSourceTypes(report), [report]);
  const radarData   = useMemo(() => scoreTopicCoverage(report, queries), [report, queries]);
  const timeline    = useMemo(() => buildAgentTimeline(duration, queries), [duration, queries]);

  const avgScore = radarData.length
    ? Math.round(radarData.reduce((a, b) => a + b.score, 0) / radarData.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginTop: "3rem" }}
    >
      {/* Section header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: "1.5rem",
        paddingBottom: "1rem",
        borderTop: "2px solid var(--accent)",
        paddingTop: "1.25rem",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--accent)",
          fontWeight: 600,
        }}>
          Report Analytics
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        {partial && (
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            color: "var(--term-amber)",
            padding: "2px 8px",
            border: "1px solid var(--term-amber)",
            borderRadius: 99,
          }}>
            Partial Result
          </span>
        )}
      </div>

      {/* ── Row 1: Stat Cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "0.75rem",
        marginBottom: "1.75rem",
      }}>
        <StatCard label="Word Count"      value={wordCount.toLocaleString()} sub="in report body" />
        <StatCard label="Citations"       value={citations}  sub="references found" />
        <StatCard label="Reading Time"    value={`${readingMins}m`} sub="at 200 wpm" />
        <StatCard label="Sub-Queries"     value={queries.length} sub="search queries used" />
        <StatCard label="Gen. Time"       value={duration ? `${duration}s` : "—"} sub="total duration" />
        <StatCard label="Coverage Score"  value={`${avgScore}%`} sub="topic breadth" />
      </div>

      {/* ── Row 2: Charts ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
        marginBottom: "1rem",
      }}>

        {/* Topic Coverage Radar */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
        }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-faint)",
            marginBottom: "1rem",
          }}>
            Topic Coverage
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="var(--border-med)" />
              <PolarAngleAxis
                dataKey="topic"
                tick={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fill: "var(--text-muted)",
                }}
              />
              <Radar
                name="Coverage"
                dataKey="score"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.18}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Timeline */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
        }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-faint)",
            marginBottom: "1rem",
          }}>
            Agent Time Breakdown
          </p>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={timeline}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--text-faint)" }}
                  tickFormatter={(v) => `${v}s`}
                  stroke="var(--border)"
                />
                <YAxis
                  type="category"
                  dataKey="phase"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--text-muted)" }}
                  stroke="var(--border)"
                  width={58}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="seconds" radius={[0, 4, 4, 0]} name="seconds">
                  {timeline.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text-faint)",
            }}>
              Duration data unavailable
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Citation Source Bar Chart (full width) ── */}
      {sourceData.length > 0 && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
          marginBottom: "1rem",
        }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-faint)",
            marginBottom: "1rem",
          }}>
            Citation Source Breakdown
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sourceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--text-muted)" }}
                stroke="var(--border)"
              />
              <YAxis
                tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--text-faint)" }}
                stroke="var(--border)"
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="count">
                {sourceData.map((entry, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[entry.name] || "#8B949E"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Source legend */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginTop: "0.75rem",
          }}>
            {sourceData.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: SOURCE_COLORS[s.name] || "#8B949E",
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  color: "var(--text-muted)",
                }}>
                  {s.name} ({s.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 4: Sub-Query List ── */}
      {queries.length > 0 && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
        }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-faint)",
            marginBottom: "1rem",
          }}>
            Search Queries Executed ({queries.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {queries.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "6px 10px",
                  background: "var(--bg)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  color: "var(--accent)",
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}>
                  {q}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
