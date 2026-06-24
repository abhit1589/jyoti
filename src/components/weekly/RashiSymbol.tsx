import type { ReactElement } from "react";

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Traditional Jyotish rashi emblems: Mesha → Meena. */
const ICONS: ((props: { className?: string }) => ReactElement)[] = [
  // 1 Mesha — ram
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <path {...S} d="M5 17c2-5 5-7 9-6 2 0 3.5 1.5 4.5 4" />
      <path {...S} d="M7 11c-1.5-2.5-1-4.5 1-6" />
      <path {...S} d="M9 9c-2-1-3.5 0-4 2" />
      <path {...S} d="M14 10c1.5-2 3.5-2 5 0" />
      <circle {...S} cx="16.5" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  ),
  // 2 Vrishabha — bull
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <path {...S} d="M6 16c2-4 5-6 9-5 2.5.5 4 2.5 4.5 5" />
      <path {...S} d="M8 11c-1-3 0-5 2.5-6.5" />
      <path {...S} d="M8 11c-2.5-1-4 0-4.5 2" />
      <path {...S} d="M15 10c1.5-2.5 4-3 5.5-1" />
      <path {...S} d="M15 10c2-1.5 3.5-.5 4 1.5" />
      <circle {...S} cx="17" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  ),
  // 3 Mithuna — couple
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <circle {...S} cx="8" cy="7" r="2.5" />
      <path {...S} d="M8 9.5v5M6 12h4" />
      <circle {...S} cx="16" cy="7" r="2.5" />
      <path {...S} d="M16 9.5v5M14 12h4" />
      <path {...S} d="M10.5 17.5c.5-1.5 1.5-2 3-2s2.5.5 3 2" />
    </svg>
  ),
  // 4 Karka — crab
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <ellipse {...S} cx="12" cy="13" rx="4" ry="3" />
      <path {...S} d="M5 11l-2-2M5 15l-2 2M19 11l2-2M19 15l2 2" />
      <path {...S} d="M7 9l-1.5-2M17 9l1.5-2" />
      <path {...S} d="M9 16l-1 2M15 16l1 2" />
    </svg>
  ),
  // 5 Simha — lion
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <circle {...S} cx="12" cy="12" r="5.5" />
      <path {...S} d="M7 8c-1-2-2.5-2.5-4-2M17 8c1-2 2.5-2.5 4-2" />
      <path {...S} d="M8.5 10.5c.5 1 1.5 1.5 3.5 1.5s3-0.5 3.5-1.5" />
      <circle {...S} cx="10" cy="11" r="0.6" fill="currentColor" stroke="none" />
      <circle {...S} cx="14" cy="11" r="0.6" fill="currentColor" stroke="none" />
      <path {...S} d="M11 14.5c.5.8 1.2 1.2 2 0" />
    </svg>
  ),
  // 6 Kanya — maiden with grain
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <circle {...S} cx="12" cy="6.5" r="2.5" />
      <path {...S} d="M12 9v8" />
      <path {...S} d="M9.5 13h5" />
      <path {...S} d="M14 9.5c1.5 2 2 4 1.5 6.5" />
      <path {...S} d="M15 11l2-1M15 13l2.5 0M15 15l2 1" />
      <path {...S} d="M8 18.5h8" />
    </svg>
  ),
  // 7 Tula — scales
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <path {...S} d="M12 4v16" />
      <path {...S} d="M6 8h12" />
      <path {...S} d="M6 8l-3 5h6l-3-5z" />
      <path {...S} d="M18 8l-3 5h6l-3-5z" />
      <path {...S} d="M5 13h14" />
    </svg>
  ),
  // 8 Vrishchika — scorpion
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <path {...S} d="M6 16c2-2 4-2.5 6-1.5s3 2 4 4" />
      <path {...S} d="M8 14l-2-2M10 13l-1.5-2.5M12 12.5V9" />
      <path {...S} d="M12 9c0-2 1-3.5 3-4" />
      <path {...S} d="M16 16c2-3 4-4 6-3" />
      <path {...S} d="M20 13l1-2" />
      <circle {...S} cx="5" cy="17" r="1" />
      <circle {...S} cx="7" cy="15.5" r="0.8" />
    </svg>
  ),
  // 9 Dhanu — bow and arrow
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <path {...S} d="M6 18c6-8 10-10 14-8" />
      <path {...S} d="M6 18c0-6 2-10 6-12" />
      <path {...S} d="M8 16l8-8" />
      <path {...S} d="M14 6l3-1 1 3-4 2z" />
      <path {...S} d="M6 18l-1.5 1.5M6 18l1.5 1.5" />
    </svg>
  ),
  // 10 Makara — sea creature
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <path {...S} d="M4 14c2-1 4-1 6 0s4 1 6 0" />
      <path {...S} d="M16 14c2 1 3.5 3 4 6" />
      <path {...S} d="M20 20c-1-2-2.5-3-4-3.5" />
      <path {...S} d="M5 14c-1-2-1-4 1-5.5 2-1.5 4-1 5.5.5" />
      <path {...S} d="M6.5 9.5l-1-1.5M8 8.5l.5-2" />
      <circle {...S} cx="7.5" cy="11" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  // 11 Kumbha — kalasha (pot)
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <path {...S} d="M9 5h6" />
      <path {...S} d="M10 5c0-1 .5-2 2-2s2 1 2 2" />
      <path {...S} d="M8 7h8l-1 12c0 1.5-1.5 2.5-3 2.5s-3-1-3-2.5L8 7z" />
      <path {...S} d="M9 11h6M9 14h6" />
      <ellipse {...S} cx="12" cy="19" rx="3" ry="0.8" />
    </svg>
  ),
  // 12 Meena — two fish
  (p) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden>
      <path {...S} d="M4 9c3-2 6-2 8 0s5 2 8 0" />
      <path {...S} d="M4 9l-2 1 2 1" />
      <path {...S} d="M20 9l2 1-2 1" />
      <path {...S} d="M4 15c3 2 6 2 8 0s5-2 8 0" />
      <path {...S} d="M4 15l-2-1 2-1" />
      <path {...S} d="M20 15l2-1-2-1" />
      <circle {...S} cx="7" cy="9" r="0.6" fill="currentColor" stroke="none" />
      <circle {...S} cx="17" cy="15" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
];

interface RashiSymbolProps {
  /** 0-based index: 0 = Mesha, 11 = Meena */
  index: number;
  className?: string;
}

export function RashiSymbol({ index, className }: RashiSymbolProps) {
  const Icon = ICONS[index] ?? ICONS[0];
  return <Icon className={className} />;
}
