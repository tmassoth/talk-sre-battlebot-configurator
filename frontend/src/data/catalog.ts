// Static catalog data ported from the Flask app's Python constants
// (VEHICLE_TYPES, POWERTRAINS).
//
// Colors, engines and the maintenance-mode setting now load at runtime from
// Azure SQL via the catalog API (see server/ and src/data/api.ts). The table
// schema/seed data lives in deploy/sql/.

import flipperImg from "../../images/flipper.png";
import spinnerImg from "../../images/spinner.png";
import hammerImg from "../../images/hammer.png";

export type VehicleTypeKey = "flipper" | "spinner" | "hammer";
export type PowertrainKey = "kinetic" | "electric";

export interface VehicleType {
  key: VehicleTypeKey;
  label: string;
  basePrice: number;
  description: string;
  /** URL to the battlebot's product image. */
  image: string;
}

export interface Powertrain {
  key: PowertrainKey;
  label: string;
  price: number;
}

export interface Color {
  id: string;
  label: string;
  hex: string;
  price: number;
}

export interface Engine {
  id: string;
  label: string;
  power: string;
  price: number;
}

export const VEHICLE_TYPES: Record<VehicleTypeKey, VehicleType> = {
  flipper: {
    key: "flipper",
    label: "Flipper",
    basePrice: 8000,
    description: "Low-profile launcher — send opponents flying out of the arena.",
    image: flipperImg,
  },
  spinner: {
    key: "spinner",
    label: "Spinner",
    basePrice: 10000,
    description: "High-RPM kinetic kill — devastating single-hit damage.",
    image: spinnerImg,
  },
  hammer: {
    key: "hammer",
    label: "Hammer",
    basePrice: 9000,
    description: "Controlled overhead strikes — crush armour with brute force.",
    image: hammerImg,
  },
};

export const POWERTRAINS: Record<PowertrainKey, Powertrain> = {
  kinetic: { key: "kinetic", label: "Kinetic (pneumatic / hydraulic)", price: 0 },
  electric: { key: "electric", label: "Electric (brushless)", price: 3000 },
};

// Fixed error code surfaced (and logged) when the payment service is down.
export const PAYMENT_ERROR_CODE = "PAY-MSUTY3ZE-1OFQ";

// Deliberately unreachable host used to probe payment availability, matching
// the original checkout template's data-payment-url.
export const PAYMENT_URL = "https://notfunctional.local";
