import { Box, Typography, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { VEHICLE_TYPES } from "../data/catalog";
import { VehicleImage } from "../components/icons";
import { formatEuro } from "../utils/format";
import { palette } from "../theme";

// Bot class selection — ported from templates/select_type.html.
export default function SelectTypePage() {
  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 5 }, width: "100%" }}>
      <Box sx={{ mb: 5 }}>
        <Link
          component={RouterLink}
          to="/"
          underline="none"
          sx={{
            fontSize: ".875rem",
            color: palette.textMuted,
            fontWeight: 500,
            "&:hover": { color: palette.brand },
          }}
        >
          ← Back
        </Link>
        <Typography
          component="h1"
          sx={{ fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-.025em", mt: 0.5, mb: 0.5 }}
        >
          Choose Your Battlebot Class
        </Typography>
        <Typography sx={{ color: palette.textMuted }}>
          Select the chassis archetype you'd like to build.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 2,
        }}
      >
        {Object.values(VEHICLE_TYPES).map((v) => (
          <Box
            key={v.key}
            component={RouterLink}
            to={`/configure/${v.key}`}
            sx={{
              backgroundColor: palette.surface,
              border: `2px solid ${palette.border}`,
              borderRadius: 3,
              p: 4,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              textDecoration: "none",
              color: "inherit",
              transition: "border-color .18s ease, box-shadow .18s ease, transform .18s ease",
              "&:hover": {
                borderColor: palette.brand,
                boxShadow: "0 4px 16px rgba(0,0,0,.1)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <VehicleImage
              src={v.image}
              alt={v.label}
              sx={{ width: "100%", height: 150, mb: 1, borderRadius: 2, backgroundColor: "#fff" }}
            />
            <Typography component="h2" sx={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {v.label}
            </Typography>
            <Typography sx={{ fontSize: ".88rem", color: palette.textMuted, flex: 1 }}>
              {v.description}
            </Typography>
            <Typography
              sx={{ fontWeight: 600, color: palette.brand, fontSize: ".95rem", mt: 1 }}
            >
              From {formatEuro(v.basePrice)}
            </Typography>
            <Typography sx={{ fontSize: ".85rem", fontWeight: 600, color: palette.brand }}>
              Configure →
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
