import { useMemo, useState, type ReactNode } from "react";
import { Box, Typography, Button, Link } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link as RouterLink, useParams, useNavigate, Navigate } from "react-router-dom";
import {
  VEHICLE_TYPES,
  POWERTRAINS,
  type VehicleTypeKey,
  type PowertrainKey,
} from "../data/catalog";
import { useCatalogData, enginesFor } from "../data/CatalogContext";
import { VehicleImage } from "../components/icons";
import { formatEuro } from "../utils/format";
import { palette } from "../theme";

const SECTION_TITLE_SX = {
  fontSize: ".7rem",
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase" as const,
  color: palette.textMuted,
  mb: 1.5,
};

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

function OptionCard({ selected, onClick, children }: OptionCardProps) {
  return (
    <Box
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        backgroundColor: selected ? palette.brandLight : palette.surface,
        border: `2px solid ${selected ? palette.brand : palette.border}`,
        borderRadius: "10px",
        px: 1.4,
        py: 1.1,
        cursor: "pointer",
        transition: "border-color .18s ease, background .18s ease",
        "&:hover": { borderColor: palette.brand },
        outline: "none",
      }}
    >
      {children}
    </Box>
  );
}

export default function ConfigurePage() {
  const { vehicleType } = useParams<{ vehicleType: string }>();
  const navigate = useNavigate();
  const catalog = useCatalogData();
  const COLORS = catalog.colors;

  const vehicle =
    vehicleType && vehicleType in VEHICLE_TYPES
      ? VEHICLE_TYPES[vehicleType as VehicleTypeKey]
      : undefined;

  const powertrainKeys = Object.keys(POWERTRAINS) as PowertrainKey[];
  const [powertrain, setPowertrain] = useState<PowertrainKey>(powertrainKeys[0]);
  const [colorId, setColorId] = useState<string>(COLORS[0].id);
  const [engineId, setEngineId] = useState<string>(enginesFor(catalog, powertrainKeys[0])[0].id);
  const [pop, setPop] = useState(0);

  const engines = useMemo(() => enginesFor(catalog, powertrain), [catalog, powertrain]);

  if (!vehicle) {
    return <Navigate to="/select" replace />;
  }

  const selectedColor = COLORS.find((c) => c.id === colorId) ?? COLORS[0];
  const selectedEngine = engines.find((e) => e.id === engineId) ?? engines[0];

  const ptPrice = POWERTRAINS[powertrain].price;
  const colorPrice = selectedColor.price;
  const engPrice = selectedEngine.price;
  const total = vehicle.basePrice + ptPrice + colorPrice + engPrice;

  const triggerPop = () => setPop((n) => n + 1);

  const handlePowertrain = (key: PowertrainKey) => {
    if (key === powertrain) return;
    setPowertrain(key);
    // Reset weapon to the first engine of the new power class.
    setEngineId(enginesFor(catalog, key)[0].id);
    triggerPop();
  };

  const handleColor = (id: string) => {
    setColorId(id);
    triggerPop();
  };

  const handleEngine = (id: string) => {
    setEngineId(id);
    triggerPop();
  };

  const handleBuild = () => {
    const params = new URLSearchParams({
      powertrain,
      color: colorId,
      engine: engineId,
    });
    navigate(`/checkout/${vehicle.key}?${params.toString()}`);
  };

  const ptLabel = powertrain.charAt(0).toUpperCase() + powertrain.slice(1);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        flexDirection: { xs: "column", md: "row" },
        minHeight: "calc(100vh - 56px)",
      }}
    >
      {/* ── Left: options panel ── */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: { xs: "100%", md: "calc(100% - 340px)" },
          px: { xs: 2.5, md: 5 },
          py: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Link
            component={RouterLink}
            to="/select"
            underline="none"
            sx={{
              fontSize: ".875rem",
              color: palette.textMuted,
              fontWeight: 500,
              "&:hover": { color: palette.brand },
            }}
          >
            ← Change bot class
          </Link>
          <Typography
            component="h1"
            sx={{
              fontSize: "1.7rem",
              fontWeight: 700,
              letterSpacing: "-.025em",
              mt: 0.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <VehicleImage src={vehicle.image} alt={vehicle.label} sx={{ height: 40, width: "auto", borderRadius: 1 }} /> {vehicle.label}
          </Typography>
        </Box>

        {/* Power class */}
        <Box sx={{ mb: 5 }}>
          <Typography component="h2" sx={SECTION_TITLE_SX}>
            Weapon Power Class
          </Typography>
          <Box role="radiogroup" aria-label="Weapon power class" sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {powertrainKeys.map((key) => {
              const pt = POWERTRAINS[key];
              const selected = key === powertrain;
              return (
                <OptionCard key={key} selected={selected} onClick={() => handlePowertrain(key)}>
                  <Typography sx={{ flex: 1, fontWeight: 500, fontSize: ".95rem" }}>
                    {pt.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: ".85rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      color: selected ? palette.brand : palette.textMuted,
                    }}
                  >
                    {pt.price === 0 ? "Included" : `+${formatEuro(pt.price)}`}
                  </Typography>
                </OptionCard>
              );
            })}
          </Box>
        </Box>

        {/* Paint job */}
        <Box sx={{ mb: 5 }}>
          <Typography component="h2" sx={SECTION_TITLE_SX}>
            Armour Paint Job
          </Typography>
          <Box
            role="radiogroup"
            aria-label="Paint job"
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(3, 1fr)",
                sm: "repeat(auto-fill, minmax(130px, 1fr))",
              },
              gap: 1,
            }}
          >
            {COLORS.map((c) => {
              const selected = c.id === colorId;
              return (
                <Box
                  key={c.id}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  title={`${c.label}${c.price > 0 ? ` (+${formatEuro(c.price)})` : " (Included)"}`}
                  onClick={() => handleColor(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleColor(c.id);
                    }
                  }}
                  sx={{
                    backgroundColor: selected ? palette.brandLight : palette.surface,
                    border: `2px solid ${selected ? palette.brand : palette.border}`,
                    borderRadius: "10px",
                    px: 1,
                    pt: 1,
                    pb: 0.75,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                    transition: "border-color .18s ease, background .18s ease",
                    "&:hover": { borderColor: palette.brand },
                    outline: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      backgroundColor: c.hex,
                      border: "2px solid rgba(0,0,0,.1)",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,.15)",
                    }}
                  />
                  <Typography
                    sx={{ fontSize: ".75rem", fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}
                  >
                    {c.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: ".72rem",
                      fontWeight: 600,
                      color: selected ? palette.brand : palette.textMuted,
                    }}
                  >
                    {c.price === 0 ? "Incl." : `+${formatEuro(c.price)}`}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Weapon */}
        <Box sx={{ mb: 5 }}>
          <Typography component="h2" sx={SECTION_TITLE_SX}>
            Weapon System
          </Typography>
          <Box role="radiogroup" aria-label="Weapon" sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {engines.map((e) => {
              const selected = e.id === engineId;
              return (
                <OptionCard key={e.id} selected={selected} onClick={() => handleEngine(e.id)}>
                  <Typography sx={{ flex: 1, fontWeight: 500, fontSize: ".95rem" }}>
                    {e.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: ".8rem",
                      color: palette.textMuted,
                      fontWeight: 500,
                      backgroundColor: palette.bg,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 999,
                    }}
                  >
                    {e.power}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: ".85rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      color: selected ? palette.brand : palette.textMuted,
                    }}
                  >
                    {e.price === 0 ? "Included" : `+${formatEuro(e.price)}`}
                  </Typography>
                </OptionCard>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* ── Right: price summary ── */}
      <Box
        component="aside"
        sx={{
          width: { xs: "100%", md: 340 },
          flexShrink: 0,
          position: { xs: "static", md: "sticky" },
          top: 56,
          height: { xs: "auto", md: "calc(100vh - 56px)" },
          overflowY: "auto",
          backgroundColor: palette.surface,
          borderLeft: { xs: "none", md: `1px solid ${palette.border}` },
          borderTop: { xs: `1px solid ${palette.border}`, md: "none" },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: { xs: 3, md: 3 }, display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          <Typography component="h2" sx={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-.01em" }}>
            Your Build
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.7 }}>
            <PriceRow label={`${vehicle.label} chassis base price`} value={formatEuro(vehicle.basePrice)} />
            {ptPrice > 0 && (
              <PriceRow label={`${ptLabel} weapon power`} value={`+${formatEuro(ptPrice)}`} />
            )}
            {colorPrice > 0 && (
              <PriceRow label={selectedColor.label} value={`+${formatEuro(colorPrice)}`} />
            )}
            {engPrice > 0 && (
              <PriceRow label={selectedEngine.label} value={`+${formatEuro(engPrice)}`} />
            )}
          </Box>

          <Box sx={{ height: "1px", backgroundColor: palette.border, my: 0.25 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 700 }}>
            <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>Total</Typography>
            <Typography
              key={pop}
              sx={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: palette.brand,
                letterSpacing: "-.02em",
                animation: "price-pop .3s ease",
                "@keyframes price-pop": {
                  "0%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.1)", color: palette.green },
                  "100%": { transform: "scale(1)" },
                },
              }}
            >
              {formatEuro(total)}
            </Typography>
          </Box>

          <Typography sx={{ fontSize: ".75rem", color: palette.textMuted, lineHeight: 1.5 }}>
            Prices include VAT. Arena entry fees not included.
          </Typography>

          <Button
            variant="contained"
            onClick={handleBuild}
            endIcon={<ArrowForwardIcon />}
            sx={{ mt: "auto", width: "100%", py: 1.25, borderRadius: "10px", fontSize: ".95rem" }}
          >
            Build My Bot
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1, fontSize: ".875rem" }}>
      <Typography sx={{ color: palette.textMuted, flex: 1, fontSize: ".875rem" }}>{label}</Typography>
      <Typography sx={{ fontWeight: 500, fontSize: ".875rem" }}>{value}</Typography>
    </Box>
  );
}
