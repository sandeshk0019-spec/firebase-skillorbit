export function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary))' }} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer hexagon */}
      <path
        d="M 50,10 L 93.3,35 V 85 L 50,110 L 6.7,85 V 35 Z"
        fill="none"
        stroke="url(#g)"
        strokeWidth="5"
        style={{ filter: 'url(#glow)' }}
      />
      {/* Inner circuit pattern */}
      <path
        d="M 50,50 m -20,0 h 10 l 5,-8.66 l 10,0 l 5,8.66 h 10 M 50,50 m 0,-20 v 10 l 8.66,5 v 10 l -8.66,5 v 10 M 50,50 m 0,-20 v 10 l -8.66,5 v 10 l 8.66,5 v 10"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="5" fill="hsl(var(--accent))" />
    </svg>
  );
}
