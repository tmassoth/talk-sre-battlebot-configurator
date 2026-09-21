import { useRef, useState, type FormEvent } from "react";
import {
  Box,
  Typography,
  Button,
  Link,
  TextField,
  Alert,
  AlertTitle,
} from "@mui/material";
import { Link as RouterLink, useParams, useSearchParams, Navigate } from "react-router-dom";
import {
  VEHICLE_TYPES,
  POWERTRAINS,
  PAYMENT_ERROR_CODE,
  type VehicleTypeKey,
  type PowertrainKey,
} from "../data/catalog";
import { useCatalogData, enginesFor } from "../data/CatalogContext";
import { submitOrder } from "../data/payment";
import { VehicleImage } from "../components/icons";
import { formatEuro } from "../utils/format";
import { MAINTENANCE_MODE } from "../config";
import { palette } from "../theme";

const TIMEOUT_MS = 5000;

const SECTION_TITLE_SX = {
  fontSize: ".7rem",
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase" as const,
  color: palette.textMuted,
  mb: 1.5,
};

export default function CheckoutPage() {
  const { vehicleType } = useParams<{ vehicleType: string }>();
  const [searchParams] = useSearchParams();
  const [showError, setShowError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const catalog = useCatalogData();
  const COLORS = catalog.colors;

  const vehicle =
    vehicleType && vehicleType in VEHICLE_TYPES
      ? VEHICLE_TYPES[vehicleType as VehicleTypeKey]
      : undefined;

  const powertrainKey = (searchParams.get("powertrain") ?? "").toLowerCase();
  const colorId = searchParams.get("color") ?? "";
  const engineId = searchParams.get("engine") ?? "";

  if (!vehicle) {
    return <Navigate to="/select" replace />;
  }

  const isValidPowertrain = powertrainKey in POWERTRAINS;
  const powertrain = isValidPowertrain ? POWERTRAINS[powertrainKey as PowertrainKey] : undefined;
  const color = COLORS.find((c) => c.id === colorId);
  const engine = powertrain ? enginesFor(catalog, powertrain.key).find((e) => e.id === engineId) : undefined;

  // Invalid selection → send the user back to reconfigure this bot.
  if (!powertrain || !color || !engine) {
    return <Navigate to={`/configure/${vehicle.key}`} replace />;
  }

  const total = vehicle.basePrice + powertrain.price + color.price + engine.price;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (MAINTENANCE_MODE) return;

    // Snapshot the form fields before any await (currentTarget is transient).
    const customer = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, string>;

    setShowError(false);
    setProcessing(true);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // Forward the order to the payment backend, which persists it and hands
      // off to the payment provider. A backend/network failure rejects here.
      const result = await submitOrder(
        {
          customer,
          order: {
            vehicle: vehicle.key,
            vehicleLabel: vehicle.label,
            powertrain: powertrain.key,
            color: color.id,
            engine: engine.id,
            total,
          },
        },
        controller.signal,
      );
      clearTimeout(timer);
      // Order stored → follow the payment provider redirect.
      window.location.href = result.paymentUrl;
    } catch (err) {
      clearTimeout(timer);
      setShowError(true);
      setProcessing(false);
      // Defer scroll until the alert has rendered.
      window.setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 5 }, width: "100%" }}>
      <Box sx={{ mb: 5 }}>
        <Link
          component={RouterLink}
          to={`/configure/${vehicle.key}`}
          underline="none"
          sx={{
            fontSize: ".875rem",
            color: palette.textMuted,
            fontWeight: 500,
            "&:hover": { color: palette.brand },
          }}
        >
          ← Back to configurator
        </Link>
        <Typography
          component="h1"
          sx={{ fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-.025em", mt: 0.5, mb: 0.5 }}
        >
          Checkout
        </Typography>
        <Typography sx={{ color: palette.textMuted }}>
          Confirm your build, delivery and payment details.
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 340px" },
          gap: 4,
          alignItems: "start",
        }}
      >
        {MAINTENANCE_MODE && (
          <Alert
            severity="warning"
            sx={{ gridColumn: "1 / -1", borderRadius: 3 }}
          >
            <AlertTitle>Order saved — processing delayed.</AlertTitle>
            Due to technical issues your order cannot be completed right now. We've
            saved your current build and will process it as soon as our checkout
            service is available again.
          </Alert>
        )}

        {showError && (
          <Alert
            ref={errorRef}
            severity="error"
            sx={{ gridColumn: "1 / -1", borderRadius: 3 }}
          >
            <AlertTitle>Payment service is currently not available.</AlertTitle>
            We couldn't reach the payment provider. Please try again in a moment.
            <Box sx={{ mt: 1, fontSize: ".8rem" }}>
              Error code:{" "}
              <Box
                component="code"
                sx={{
                  backgroundColor: "rgba(127, 29, 29, .12)",
                  px: 0.5,
                  py: 0.1,
                  borderRadius: "4px",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {PAYMENT_ERROR_CODE}
              </Box>
            </Box>
          </Alert>
        )}

        {/* ── Left: forms ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box
            sx={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 3,
              p: 3,
            }}
          >
            <Typography component="h2" sx={SECTION_TITLE_SX}>
              Delivery location
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Field label="Full name" name="name" autoComplete="name" defaultValue="Your Name" />
              <Field label="Email" name="email" type="email" autoComplete="email" defaultValue="Your Email" />
              <Field label="Street address" name="address" autoComplete="street-address" defaultValue="Your Street" full />
              <Field label="City" name="city" autoComplete="address-level2" defaultValue="Your City" />
              <Field label="Postal code" name="postal_code" autoComplete="postal-code" defaultValue="Your Postal Code" />
              <Field label="Country" name="country" autoComplete="country-name" defaultValue="Your Country" full />
            </Box>
          </Box>

          <Box
            sx={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 3,
              p: 3,
            }}
          >
            <Typography component="h2" sx={SECTION_TITLE_SX}>
              Payment information
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Field label="Cardholder name" name="card_name" autoComplete="cc-name" defaultValue="Your Name" full />
              <Field label="Card number" name="card_number" autoComplete="cc-number" defaultValue="5412 7556 1839 4421" full />
              <Field label="Expiry (MM/YY)" name="card_expiry" autoComplete="cc-exp" defaultValue="09/28" />
              <Field label="CVC" name="card_cvc" autoComplete="cc-csc" defaultValue="418" />
            </Box>
          </Box>
        </Box>

        {/* ── Right: order summary ── */}
        <Box
          component="aside"
          sx={{
            position: { xs: "static", md: "sticky" },
            top: 72,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 3,
          }}
        >
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography component="h2" sx={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-.01em" }}>
              Order summary
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: "1rem" }}>
              <VehicleImage src={vehicle.image} alt={vehicle.label} sx={{ height: 32, width: "auto", borderRadius: 1 }} />
              <strong>{vehicle.label}</strong>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.7 }}>
              <SummaryRow label={`${vehicle.label} chassis`} value={formatEuro(vehicle.basePrice)} />
              <SummaryRow
                label={powertrain.label}
                value={powertrain.price > 0 ? `+${formatEuro(powertrain.price)}` : "Included"}
              />
              <SummaryRow
                label={`Paint: ${color.label}`}
                value={color.price > 0 ? `+${formatEuro(color.price)}` : "Included"}
              />
              <SummaryRow
                label={`Weapon: ${engine.label} (${engine.power})`}
                value={engine.price > 0 ? `+${formatEuro(engine.price)}` : "Included"}
              />
            </Box>

            <Box sx={{ height: "1px", backgroundColor: palette.border, my: 0.25 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: palette.brand, letterSpacing: "-.02em" }}>
                {formatEuro(total)}
              </Typography>
            </Box>

            <Typography sx={{ fontSize: ".75rem", color: palette.textMuted, lineHeight: 1.5 }}>
              Prices include VAT. Arena entry fees not included.
            </Typography>

            <Button
              type="submit"
              variant="contained"
              disabled={MAINTENANCE_MODE || processing}
              title={MAINTENANCE_MODE ? "Checkout is temporarily unavailable" : undefined}
              sx={{ width: "100%", py: 1.25, borderRadius: "10px", fontSize: ".95rem" }}
            >
              {MAINTENANCE_MODE ? "Processing later…" : processing ? "Processing…" : "Complete Order"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

interface FieldProps {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  autoComplete?: string;
  full?: boolean;
}

function Field({ label, name, defaultValue, type = "text", autoComplete, full }: FieldProps) {
  return (
    <TextField
      label={label}
      name={name}
      type={type}
      defaultValue={defaultValue}
      autoComplete={autoComplete}
      size="small"
      fullWidth
      sx={{ gridColumn: full ? "1 / -1" : "auto" }}
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1, fontSize: ".875rem" }}>
      <Typography sx={{ color: palette.textMuted, flex: 1, fontSize: ".875rem" }}>{label}</Typography>
      <Typography sx={{ fontWeight: 500, fontSize: ".875rem" }}>{value}</Typography>
    </Box>
  );
}
