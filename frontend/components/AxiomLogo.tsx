export default function AxiomLogo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Axiom"
    >
      {/* Geometric abstract A — two angled strokes meeting at apex, crossbar */}
      <rect width="32" height="32" rx="6" fill="#8B0000" />
      {/* Left leg */}
      <path d="M8 25L16 7" stroke="#F2F0EA" strokeWidth="2.2" strokeLinecap="round" />
      {/* Right leg */}
      <path d="M16 7L24 25" stroke="#F2F0EA" strokeWidth="2.2" strokeLinecap="round" />
      {/* Crossbar */}
      <path d="M11 19h10" stroke="#F2F0EA" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
