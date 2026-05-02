"use client";
import { useState, useEffect } from "react";
import AxiomLogo from "./AxiomLogo";
import type { SessionStatus } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { STATUS_CONFIG } from "@/utils/status";


interface Props {
  status: SessionStatus;
  onLogoClick: () => void;
  onHubClick?: () => void;
  sessionTitle?: string;
  showNav: boolean;
}

export default function NavBar({ status, onLogoClick, onHubClick, sessionTitle, showNav }: Props) {
  const { theme, toggleTheme } = useTheme();
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  const logoTooltip = showNav ? "Toggle sessions panel" : "View research history";

  return (
    <nav
      className="glass-nav"
      style={{
        height:   52,
        display:  "flex",
        alignItems: "center",
        padding:  "0 18px",
        position: "sticky",
        top:      0,
        zIndex:   50,
      }}
    >
      <button
        onClick={onLogoClick}
        title={logoTooltip}
        aria-label={logoTooltip}
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          9,
          background:   "none",
          border:       "none",
          cursor:       "pointer",
          padding:      "4px 8px",
          borderRadius: "var(--radius)",
          flexShrink:   0,
          transition:   "background 0.14s",
          outline:      "none",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = "var(--accent-light)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "none";
        }}
      >
        <AxiomLogo size={24} />
        <span 
          className="nav-logo-text"
          style={{
            fontFamily:    "var(--font-ui)",
            fontWeight:    800,
            fontSize:      "1.125rem",
            color:         "var(--text-primary)",
            letterSpacing: "-0.04em",
            lineHeight:    1,
          }}
        >
          Axiom <span style={{ color: "var(--accent)", fontSize: "0.75rem", verticalAlign: "top", marginLeft: 1 }}>v4</span>
        </span>
      </button>

      {showNav && (
        <div style={{
          width:      1,
          height:     20,
          background: "var(--border)",
          margin:     "0 14px",
          flexShrink: 0,
        }} />
      )}

      {showNav && sessionTitle && (
        <span 
          className="nav-session-title"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginRight: 12,
            flexShrink: 1,
          }}
        >
          {sessionTitle}
        </span>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {showNav && (
          <div style={{
            display:    "flex",
            alignItems: "center",
            gap:        6,
            padding:    "4px 10px",
            borderRadius: 99,
            background: "var(--bg)",
            border:     "1px solid var(--border)",
            flexShrink: 0,
          }}>
            <span style={{
              width:        6,
              height:       6,
              borderRadius: "50%",
              background:   s.dot,
              flexShrink:   0,
              animation: (status === "running" || status === "queued")
                ? "soft-pulse 1.4s ease infinite" : "none",
            }} />
            <span 
              className="nav-status-label"
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.625rem",
                fontWeight:    400,
                color:         "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.09em",
              }}
            >
              {s.label}
            </span>
          </div>
        )}

        {/* ── Theme Toggle ─────────────────────────────────────────── */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.2s",
            outline: "none",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          {theme === "light" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>

        {showNav && onHubClick && (
          <button
            onClick={onHubClick}
            className="mobile-hub-btn"
            style={{
              width: 32,
              height: 32,
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-muted)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
          </button>
        )}
      </div>
    </nav>
  );
}
