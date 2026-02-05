export function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary))' }} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill="none" stroke="url(#g)" strokeWidth="8" />
      <circle cx="50" cy="50" r="10" fill="hsl(var(--accent))" />
      <circle
        cx="50"
        cy="50"
        r="25"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="4"
        strokeDasharray="8"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="10s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
