function LoginIllustration(props) {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="300" cy="300" r="260" fill="rgba(255,255,255,0.06)" />
      <circle cx="300" cy="300" r="200" fill="rgba(255,255,255,0.05)" />

      <rect x="150" y="120" width="300" height="360" rx="18" fill="rgba(255,255,255,0.12)" />
      <rect x="180" y="160" width="240" height="28" rx="6" fill="rgba(255,255,255,0.35)" />
      <rect x="180" y="210" width="160" height="16" rx="4" fill="rgba(255,255,255,0.25)" />

      <rect x="180" y="250" width="240" height="60" rx="10" fill="rgba(255,255,255,0.18)" />
      <circle cx="205" cy="280" r="10" fill="#00e5c8" />
      <rect x="225" y="272" width="150" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
      <rect x="225" y="288" width="100" height="6" rx="3" fill="rgba(255,255,255,0.3)" />

      <rect x="180" y="325" width="240" height="60" rx="10" fill="rgba(255,255,255,0.18)" />
      <circle cx="205" cy="355" r="10" fill="#ffca28" />
      <rect x="225" y="347" width="150" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
      <rect x="225" y="363" width="120" height="6" rx="3" fill="rgba(255,255,255,0.3)" />

      <rect x="180" y="400" width="240" height="60" rx="10" fill="rgba(255,255,255,0.18)" />
      <circle cx="205" cy="430" r="10" fill="#69f0ae" />
      <rect x="225" y="422" width="150" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
      <rect x="225" y="438" width="90" height="6" rx="3" fill="rgba(255,255,255,0.3)" />

      <g transform="translate(400,80)">
        <circle cx="40" cy="40" r="40" fill="#00acc1" />
        <path
          d="M25 40 L36 51 L57 28"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      <g transform="translate(90,420)">
        <circle cx="30" cy="30" r="30" fill="rgba(255,255,255,0.15)" />
        <path
          d="M18 30 L27 39 L44 20"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

export default LoginIllustration;
