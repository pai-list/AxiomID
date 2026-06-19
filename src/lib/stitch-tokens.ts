/**
 * Stitch UI Design Tokens
 *
 * Maps Material Design 3 tokens from Stitch-generated HTML
 * to existing CSS variables in globals.css.
 *
 * Usage: import { stitchColors, stitchTypography, stitchSpacing } from '@/lib/stitch-tokens';
 */

export const stitchColors = {
  // Surfaces
  surface: "#10131a",
  "surface-dim": "#10131a",
  "surface-container-lowest": "#0b0e15",
  "surface-container-low": "#191b23",
  "surface-container": "#1d2027",
  "surface-container-high": "#272a31",
  "surface-container-highest": "#32353c",
  "surface-bright": "#363941",

  // Primary
  primary: "#adc6ff",
  "primary-container": "#4d8eff",
  "on-primary": "#002e6a",
  "on-primary-container": "#00285d",

  // Secondary
  secondary: "#b7c8e1",
  "secondary-container": "#3a4a5f",
  "on-secondary": "#213145",
  "on-secondary-container": "#a9bad3",

  // Tertiary
  tertiary: "#ffb786",
  "tertiary-container": "#df7412",
  "on-tertiary": "#502400",
  "on-tertiary-container": "#461f00",

  // Text
  "on-surface": "#e1e2ec",
  "on-surface-variant": "#c2c6d6",

  // Error
  error: "#ffb4ab",
  "error-container": "#93000a",
  "on-error": "#690005",
  "on-error-container": "#ffdad6",

  // Outline
  outline: "#8c909f",
  "outline-variant": "#424754",

  // Inverse
  "inverse-surface": "#e1e2ec",
  "inverse-on-surface": "#2e3038",
  "inverse-primary": "#005ac2",

  // Background
  background: "#10131a",
  "on-background": "#e1e2ec",
} as const;

export const stitchTypography = {
  "display-lg": { size: "48px", lineHeight: "56px", letterSpacing: "-0.02em", weight: "600" },
  "headline-lg": { size: "32px", lineHeight: "40px", letterSpacing: "-0.01em", weight: "600" },
  "headline-md": { size: "24px", lineHeight: "32px", weight: "500" },
  "title-lg": { size: "20px", lineHeight: "28px", weight: "500" },
  "body-lg": { size: "16px", lineHeight: "24px", weight: "400" },
  "body-md": { size: "14px", lineHeight: "20px", weight: "400" },
  "label-md": { size: "12px", lineHeight: "16px", letterSpacing: "0.05em", weight: "500" },
  "code-md": { size: "14px", lineHeight: "20px", weight: "400" },
} as const;

export const stitchSpacing = {
  xs: "4px",
  sm: "8px",
  base: "4px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  gutter: "24px",
  "container-max": "1280px",
} as const;

export const stitchBorderRadius = {
  DEFAULT: "0.125rem",
  lg: "0.25rem",
  xl: "0.5rem",
  full: "0.75rem",
} as const;

/**
 * Map Stitch MD3 color tokens to existing CSS variable names.
 * Used to generate theme overrides in globals.css.
 */
export const stitchToAxiomMap = {
  "surface-container": "--bg-card",
  "surface-container-high": "--bg-card-hover",
  "surface": "--bg-deep",
  "on-surface": "--text-primary",
  "on-surface-variant": "--text-secondary",
  "primary": "--color-primary",
  "primary-container": "--axiom-purple",
  "outline": "--text-muted",
  "outline-variant": "--card-border",
} as const;
