import { Box, Typography, Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link as RouterLink } from "react-router-dom";
import BattlebotHero from "../components/BattlebotHero";
import { palette } from "../theme";

// Landing page — ported from templates/index.html (`.hero`).
export default function HomePage() {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: { xs: "column", md: "row" },
        textAlign: { xs: "center", md: "left" },
        gap: { xs: 4, md: 8 },
        px: { xs: 3, md: 4 },
        py: { xs: 6, md: 10 },
        maxWidth: 1100,
        mx: "auto",
        width: "100%",
      }}
    >
      <Box sx={{ maxWidth: 520 }}>
        <Box
          component="span"
          sx={{
            display: "inline-block",
            fontSize: ".8rem",
            fontWeight: 600,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: palette.brand,
            backgroundColor: palette.brandLight,
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            mb: 2,
          }}
        >
          Build your fighting machine
        </Box>

        <Typography
          component="h1"
          sx={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            letterSpacing: "-.03em",
            lineHeight: 1.15,
            mb: 2,
          }}
        >
          Configure Your Perfect Battlebot
        </Typography>

        <Typography
          sx={{
            fontSize: "1.05rem",
            color: palette.textMuted,
            maxWidth: 480,
            mb: 4,
            lineHeight: 1.65,
            mx: { xs: "auto", md: 0 },
          }}
        >
          Choose from our arsenal of flippers, spinners and hammers. Tune every
          detail — power class, paint job, weapon — and see your build price in
          real time.
        </Typography>

        <Button
          component={RouterLink}
          to="/select"
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          sx={{
            px: 4,
            py: 1.25,
            fontSize: "1.05rem",
            borderRadius: "10px",
          }}
        >
          Start Building
        </Button>
      </Box>

      <BattlebotHero />
    </Box>
  );
}
