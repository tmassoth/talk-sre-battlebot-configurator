import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import SelectTypePage from "./pages/SelectTypePage";
import ConfigurePage from "./pages/ConfigurePage";
import CheckoutPage from "./pages/CheckoutPage";
import { useCatalog } from "./data/CatalogContext";
import { palette } from "./theme";

export default function App() {
  const { loading, error, reload } = useCatalog();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header />
      <Box component="main" sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {loading ? (
          <CatalogLoading />
        ) : error ? (
          <CatalogError message={error} onRetry={reload} />
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/select" element={<SelectTypePage />} />
            <Route path="/configure/:vehicleType" element={<ConfigurePage />} />
            <Route path="/checkout/:vehicleType" element={<CheckoutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Box>
    </Box>
  );
}

function CatalogLoading() {
  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 8 }}>
      <CircularProgress />
    </Box>
  );
}

function CatalogError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        py: 8,
        px: 3,
        textAlign: "center",
      }}
    >
      <Typography sx={{ fontSize: "1.15rem", fontWeight: 700 }}>
        Couldn't load the catalog
      </Typography>
      <Typography sx={{ color: palette.textMuted, maxWidth: 460 }}>{message}</Typography>
      <Button variant="contained" onClick={onRetry} sx={{ borderRadius: "10px" }}>
        Try again
      </Button>
    </Box>
  );
}
