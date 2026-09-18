function DashboardBanner(props) {
  return (
    <svg
      viewBox="0 0 800 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      {...props}
    >
      <rect width="800" height="300" fill="url(#dashboard-gradient)" />
      <defs>
        <linearGradient id="dashboard-gradient" x1="0" y1="0" x2="800" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a237e" />
          <stop offset="55%" stopColor="#283593" />
          <stop offset="100%" stopColor="#00acc1" />
        </linearGradient>
      </defs>

      <circle cx="700" cy="60" r="120" fill="rgba(255,255,255,0.05)" />
      <circle cx="740" cy="220" r="70" fill="rgba(255,255,255,0.06)" />
      <circle cx="60" cy="240" r="90" fill="rgba(255,255,255,0.05)" />

      <g transform="translate(620,90)" opacity="0.9">
        <rect x="0" y="60" width="24" height="60" rx="4" fill="rgba(255,255,255,0.55)" />
        <rect x="34" y="30" width="24" height="90" rx="4" fill="rgba(255,255,255,0.75)" />
        <rect x="68" y="70" width="24" height="50" rx="4" fill="rgba(255,255,255,0.45)" />
        <rect x="102" y="10" width="24" height="110" rx="4" fill="#00e5c8" />
      </g>
    </svg>
  );
}

export default DashboardBanner;
