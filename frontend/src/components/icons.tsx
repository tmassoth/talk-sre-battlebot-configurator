import type { SxProps, Theme } from "@mui/material";
import { Box } from "@mui/material";

interface VehicleImageProps {
  src: string;
  alt: string;
  sx?: SxProps<Theme>;
}

/** Renders the battlebot's product image for a vehicle type. */
export function VehicleImage({ src, alt, sx }: VehicleImageProps) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{ display: "block", objectFit: "contain", ...sx }}
    />
  );
}
