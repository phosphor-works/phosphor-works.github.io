// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Palette catalog consumed by /palette/ (the Astro page renders both
// dark and light variants at build time, then CSS flips which one is
// visible based on the theme toggle).  Keep hex values literal — the
// whole point of this page is to surface the brand values themselves,
// so aliasing them to CSS tokens would hide what's documented.

export type Theme = "dark" | "light";

export interface BrandSwatchValue {
    hex: string;
    alias: string;
}

export interface BrandSwatch {
    name: string;
    desc: string;
    dark: BrandSwatchValue;
    light: BrandSwatchValue;
}

export const BRAND: BrandSwatch[] = [
    { name: "Cyan",   desc: "accent gradient 0",
      dark:  { hex: "#22D3EE", alias: "tailwind cyan-400" },
      light: { hex: "#0EA5E9", alias: "tailwind sky-500"  } },
    { name: "Blue",   desc: "accent gradient 1 / primary",
      dark:  { hex: "#3B82F6", alias: "tailwind blue-500" },
      light: { hex: "#3B82F6", alias: "tailwind blue-500" } },
    { name: "Purple", desc: "accent gradient 2",
      dark:  { hex: "#A855F7", alias: "tailwind purple-500" },
      light: { hex: "#7C3AED", alias: "tailwind violet-600" } },
    { name: "Rose",   desc: "accent gradient 3 / error",
      dark:  { hex: "#F43F5E", alias: "tailwind rose-500" },
      light: { hex: "#E11D48", alias: "tailwind rose-600" } },
    { name: "Navy",   desc: "bg gradient 0 / surface",
      dark:  { hex: "#0B1730", alias: "near-surface" },
      light: { hex: "#E8EEFF", alias: "light near-surface" } },
    { name: "Abyss",  desc: "bg gradient 1",
      dark:  { hex: "#070F22", alias: "surface container" },
      light: { hex: "#EEF3FF", alias: "light surface container" } },
    { name: "Void",   desc: "bg gradient 2",
      dark:  { hex: "#050916", alias: "background deep" },
      light: { hex: "#F6F9FF", alias: "light background" } },
];

// Role keys in the order we want to surface them on the page.
// ROLES_DARK and ROLES_LIGHT are filtered through this to keep the
// grid stable across themes even when a key is only defined in one.
export const ROLE_ORDER = [
    "primary", "on_primary", "primary_container", "on_primary_container",
    "secondary", "on_secondary", "secondary_container",
    "tertiary", "on_tertiary", "tertiary_container",
    "error", "on_error", "error_container",
    "background", "on_background",
    "surface", "on_surface", "surface_variant", "on_surface_variant",
    "surface_container", "surface_container_low", "surface_container_high",
    "outline", "outline_variant",
] as const;

export type RoleKey = typeof ROLE_ORDER[number];
export type RoleMap = Partial<Record<RoleKey, string>>;

export const ROLES_DARK: RoleMap = {
    primary: "#3B82F6", on_primary: "#F0F9FF",
    primary_container: "#1E3A8A", on_primary_container: "#DBEAFE",
    secondary: "#A855F7", on_secondary: "#FAF5FF", secondary_container: "#581C87",
    tertiary: "#22D3EE", on_tertiary: "#ECFEFF", tertiary_container: "#164E63",
    error: "#F43F5E", on_error: "#FFF1F2", error_container: "#881337",
    background: "#050916", on_background: "#E6EDFF",
    surface: "#0B1730", on_surface: "#E6EDFF",
    surface_variant: "#1E293B", on_surface_variant: "#94A3B8",
    surface_container: "#070F22", surface_container_low: "#050916",
    surface_container_high: "#101A36",
    outline: "#3B82F6", outline_variant: "#1E3A8A",
};

export const ROLES_LIGHT: RoleMap = {
    primary: "#3B82F6", on_primary: "#F0F9FF",
    primary_container: "#DBEAFE", on_primary_container: "#1E3A8A",
    secondary: "#A855F7", on_secondary: "#FAF5FF",
    secondary_container: "#F3E8FF",
    tertiary: "#0891B2", on_tertiary: "#ECFEFF",
    tertiary_container: "#CFFAFE",
    error: "#E11D48", on_error: "#FFF1F2",
    error_container: "#FFE4E6",
    background: "#F8FAFC", on_background: "#050916",
    surface: "#F8FAFC", on_surface: "#050916",
    surface_variant: "#E2E8F0", on_surface_variant: "#64748B",
    surface_container_low:  "#F1F5F9",
    surface_container:      "#E2E8F0",
    surface_container_high: "#CBD5E1",
    outline: "#3B82F6", outline_variant: "#93C5FD",
};

export interface AnsiCell {
    i: number;
    label: string;
    hex: string;
    alias: string;
}

export const ANSI: AnsiCell[] = [
    { i:  0, label: "black",    hex: "#050916", alias: "void" },
    { i:  1, label: "red",      hex: "#F43F5E", alias: "rose" },
    { i:  2, label: "green",    hex: "#10B981", alias: "emerald-500" },
    { i:  3, label: "yellow",   hex: "#FBBF24", alias: "amber-400"   },
    { i:  4, label: "blue",     hex: "#3B82F6", alias: "blue" },
    { i:  5, label: "magenta",  hex: "#A855F7", alias: "purple" },
    { i:  6, label: "cyan",     hex: "#22D3EE", alias: "cyan" },
    { i:  7, label: "white",    hex: "#CBD5E1", alias: "slate-300" },
    { i:  8, label: "br.black", hex: "#1E293B", alias: "slate-800" },
    { i:  9, label: "br.red",   hex: "#FB7185", alias: "rose-400" },
    { i: 10, label: "br.green", hex: "#34D399", alias: "emerald-400" },
    { i: 11, label: "br.yell.", hex: "#FCD34D", alias: "amber-300" },
    { i: 12, label: "br.blue",  hex: "#60A5FA", alias: "blue-400" },
    { i: 13, label: "br.mag.",  hex: "#C084FC", alias: "purple-400" },
    { i: 14, label: "br.cyan",  hex: "#67E8F9", alias: "cyan-300" },
    { i: 15, label: "br.white", hex: "#F1F5F9", alias: "slate-100" },
];

// WCAG gamma-corrected relative luminance with a Material-style 0.45
// threshold.  Used to pick legible on-color text for swatches.  The
// naive (R+G+B)/3 or un-gamma-corrected 0.2126R+0.7152G+0.0722B on
// 0-255 values systematically mis-classifies saturated mid-tones (it
// calls #F43F5E "bright enough for black text" when rose has a low
// perceptual luminance and reads far better with white).
export function onColor(hex: string): "#050916" | "#E6EDFF" {
    const toLinear = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const r = toLinear(parseInt(hex.slice(1, 3), 16));
    const g = toLinear(parseInt(hex.slice(3, 5), 16));
    const b = toLinear(parseInt(hex.slice(5, 7), 16));
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return L > 0.45 ? "#050916" : "#E6EDFF";
}
