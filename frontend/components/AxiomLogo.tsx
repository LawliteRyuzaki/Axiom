interface Props {
  size?: number;
}

/*
  Mark: Three stacked horizontal bars, descending in width left-to-right.
  Reads as a data hierarchy / synthesis funnel — raw inputs → refined output.
  Clean, timeless, works at any size. No color fill needed — pure carbon.
  Inspired by the signal-to-noise reduction that Axiom performs on research.
*/
export default function AxiomLogo({ size = 24 }: Props) {
  const bar = Math.round(size * 0.55);  // bar width at 55% of container
  const h   = Math.round(size * 0.09); // bar height
  const gap = Math.round(size * 0.14); // gap between bars
  const r   = Math.round(h * 0.5);     // fully rounded ends

  const totalH = h * 3 + gap * 2;
  const offsetY = Math.round((size - totalH) / 2);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Axiom"
    >
      {/* Top bar — full width */}
      <rect x={0} y={offsetY} width={bar} height={h} rx={r} fill="var(--accent)" />
      {/* Middle bar — 75% width */}
      <rect x={0} y={offsetY + h + gap} width={Math.round(bar * 0.72)} height={h} rx={r} fill="var(--text-primary)" />
      {/* Bottom bar — 46% width */}
      <rect x={0} y={offsetY + (h + gap) * 2} width={Math.round(bar * 0.44)} height={h} rx={r} fill="var(--text-primary)" opacity="0.35" />
    </svg>
  );
}
