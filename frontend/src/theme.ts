import { createTheme } from "@mui/material/styles";

// Palette lifted straight from the original CSS custom properties so the
// React + MUI build keeps the exact same look and feel as the Flask app.
export const palette = {
  brand: "#1a56db",
  brandDark: "#1340b0",
  brandLight: "#ebf0fd",
  surface: "#ffffff",
  bg: "#f4f6fa",
  border: "#dde1ea",
  text: "#111827",
  textMuted: "#6b7280",
  green: "#16a34a",
} as const;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: palette.brand,
      dark: palette.brandDark,
      light: palette.brandLight,
      contrastText: "#ffffff",
    },
    success: {
      main: palette.green,
    },
    background: {
      default: palette.bg,
      paper: palette.surface,
    },
    text: {
      primary: palette.text,
      secondary: palette.textMuted,
    },
    divider: palette.border,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.bg,
          color: palette.text,
          lineHeight: 1.5,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
