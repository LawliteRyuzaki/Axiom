interface Props {
  size?: number;
  showWordmark?: boolean;
}

export default function AxiomLogo({ size = 28, showWordmark = false }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: showWordmark ? "10px" : "0" }}>
      {/* Mark: a precision compass-rose / signal-burst — 4 diamond facets
          arranged in a tight radial pattern. Conveys synthesis, convergence,
          intelligence radiating from a core. Crimson fill, no bounding box. */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={showWordmark}
        aria-label={showWordmark ? undefined : "Axiom"}
      >
        {/* Top facet */}
        <path d="M18 2 L22 14 L18 18 L14 14 Z" fill="#8B0000" />
        {/* Right facet */}
        <path d="M34 18 L22 14 L18 18 L22 22 Z" fill="#6D0000" />
        {/* Bottom facet */}
        <path d="M18 34 L14 22 L18 18 L22 22 Z" fill="#8B0000" fillOpacity="0.75" />
        {/* Left facet */}
        <path d="M2 18 L14 22 L18 18 L14 14 Z" fill="#6D0000" fillOpacity="0.85" />
        {/* Centre dot — convergence point */}
        <circle cx="18" cy="18" r="2.5" fill="#F2F0EA" />
      </svg>

      {showWordmark && (
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: `${size * 0.75}px`,
          color: "var(--carbon)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          userSelect: "none",
        }}>
          axiom
        </span>
      )}
    </div>
  );
}
