import { AppBar, Toolbar, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { palette } from "../theme";

// Sticky site header — ported from `.site-header` / `.logo` in style.css.
export default function Header() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: palette.surface,
        borderBottom: `1px solid ${palette.border}`,
      }}
    >
      <Toolbar sx={{ minHeight: 56, px: { xs: 2, sm: 4 } }} disableGutters>
        <Box
          component={RouterLink}
          to="/"
          sx={{
            fontWeight: 700,
            fontSize: "1.2rem",
            letterSpacing: "-.02em",
            color: palette.brand,
            textDecoration: "none",
          }}
        >
          BattleBotForge
        </Box>
      </Toolbar>
    </AppBar>
  );
}
