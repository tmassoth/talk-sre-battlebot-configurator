import { Box } from "@mui/material";

// Hero battlebot illustration — ported from templates/index.html, wrapped in a
// floating container that mirrors the original `.hero-visual` animation.
export default function BattlebotHero() {
  return (
    <Box
      sx={{
        flexShrink: 0,
        fontSize: { xs: "6rem", md: "9rem" },
        filter: "drop-shadow(0 8px 24px rgba(0,0,0,.12))",
        animation: "battlebot-float 4s ease-in-out infinite",
        "@keyframes battlebot-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        lineHeight: 0,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 160"
        width="1em"
        height="1em"
        role="img"
        aria-label="Battlebot illustration"
      >
        {/* ground shadow */}
        <ellipse cx="100" cy="148" rx="78" ry="6" fill="#000" opacity=".18" />

        {/* spinning weapon disc (back) */}
        <g transform="translate(100 52)">
          <circle r="42" fill="#9ca3af" />
          <circle r="42" fill="none" stroke="#111827" strokeWidth="3" />
          <polygon points="-42,0 -56,-8 -56,8" fill="#1a56db" />
          <polygon points="42,0 56,-8 56,8" fill="#1a56db" />
          <polygon points="0,-42 -8,-56 8,-56" fill="#1a56db" />
          <polygon points="0,42 -8,56 8,56" fill="#1a56db" />
          <polygon points="29.7,-29.7 42,-38 38,-42" fill="#1a56db" />
          <polygon points="-29.7,-29.7 -42,-38 -38,-42" fill="#1a56db" />
          <polygon points="29.7,29.7 42,38 38,42" fill="#1a56db" />
          <polygon points="-29.7,29.7 -42,38 -38,42" fill="#1a56db" />
          <circle r="10" fill="#111827" />
          <circle r="4" fill="#f59e0b" />
        </g>

        {/* chassis wedge body */}
        <polygon
          points="20,118 180,118 160,78 40,78"
          fill="#374151"
          stroke="#111827"
          strokeWidth="2"
        />
        {/* front armour plates */}
        <polygon
          points="20,118 60,118 40,98"
          fill="#1f2937"
          stroke="#111827"
          strokeWidth="2"
        />
        <polygon
          points="140,118 180,118 160,98"
          fill="#1f2937"
          stroke="#111827"
          strokeWidth="2"
        />
        {/* chassis highlight */}
        <polygon points="40,78 160,78 150,86 50,86" fill="#4b5563" />

        {/* hazard stripes */}
        <rect x="70" y="92" width="60" height="10" fill="#f1c40f" />
        <polygon points="70,92 80,92 76,102 70,102" fill="#111827" />
        <polygon points="86,92 96,92 92,102 82,102" fill="#111827" />
        <polygon points="102,92 112,92 108,102 98,102" fill="#111827" />
        <polygon points="118,92 128,92 124,102 114,102" fill="#111827" />

        {/* LED eyes */}
        <circle cx="60" cy="86" r="3" fill="#ef4444" />
        <circle cx="140" cy="86" r="3" fill="#ef4444" />

        {/* wheels / treads */}
        <circle cx="42" cy="130" r="16" fill="#111827" />
        <circle cx="100" cy="134" r="14" fill="#111827" />
        <circle cx="158" cy="130" r="16" fill="#111827" />
        <circle cx="42" cy="130" r="6" fill="#9ca3af" />
        <circle cx="100" cy="134" r="5" fill="#9ca3af" />
        <circle cx="158" cy="130" r="6" fill="#9ca3af" />

        {/* antenna */}
        <line
          x1="160"
          y1="78"
          x2="172"
          y2="58"
          stroke="#111827"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="172" cy="58" r="3" fill="#ef4444" />
      </svg>
    </Box>
  );
}
