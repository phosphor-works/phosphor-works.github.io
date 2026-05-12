// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Palette catalog consumed by /palette/ (the Astro page renders both
// dark and light variants at build time, then CSS flips which one is
// visible based on the theme toggle).
//
// All hex values are sourced at build time from the canonical
// submodules/branding/palette/phosphor.toml so this file and the
// brand-asset repo can't drift. The descriptive labels (alias and
// desc strings) live here as a view-side overlay because they aren't
// part of the matugen role vocabulary the TOML follows.
//
// The `?raw` query is Vite's built-in suffix that bundles the file's
// raw text as a string at compile time. That avoids the file-system
// resolution drift between Astro's dev server and the prerendered
// chunk locations.

import { parse as parseToml } from "smol-toml";
import tomlSource from "../../submodules/branding/palette/phosphor.toml?raw";

type TomlPalette = {
    brand: Record<string, string>;
    roles: { dark: Record<string, string>; light: Record<string, string> };
    ansi: Record<string, string>;
};
const palette = parseToml(tomlSource) as unknown as TomlPalette;

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

// View-side labels for each brand swatch. The TOML's [brand] block
// only carries the dark hex (the literal SVG gradient stops); the
// light counterparts are hand-tuned and live here alongside the
// tailwind aliases users recognise.
const BRAND_LABELS: Array<{
    name: string;
    tomlKey: string;
    desc: string;
    darkAlias: string;
    light: BrandSwatchValue;
}> = [
    { name: "Cyan",   tomlKey: "cyan",   desc: "accent gradient 0",
      darkAlias: "tailwind cyan-400",
      light:  { hex: "#0EA5E9", alias: "tailwind sky-500" } },
    { name: "Blue",   tomlKey: "blue",   desc: "accent gradient 1 / primary",
      darkAlias: "tailwind blue-500",
      light:  { hex: "#3B82F6", alias: "tailwind blue-500" } },
    { name: "Purple", tomlKey: "purple", desc: "accent gradient 2",
      darkAlias: "tailwind purple-500",
      light:  { hex: "#7C3AED", alias: "tailwind violet-600" } },
    { name: "Rose",   tomlKey: "rose",   desc: "accent gradient 3 / error",
      darkAlias: "tailwind rose-500",
      light:  { hex: "#E11D48", alias: "tailwind rose-600" } },
    { name: "Navy",   tomlKey: "navy",   desc: "bg gradient 0 / surface",
      darkAlias: "near-surface",
      light:  { hex: "#E8EEFF", alias: "light near-surface" } },
    { name: "Abyss",  tomlKey: "abyss",  desc: "bg gradient 1",
      darkAlias: "surface container",
      light:  { hex: "#EEF3FF", alias: "light surface container" } },
    { name: "Void",   tomlKey: "void",   desc: "bg gradient 2",
      darkAlias: "background deep",
      light:  { hex: "#F6F9FF", alias: "light background" } },
];

export const BRAND: BrandSwatch[] = BRAND_LABELS.map((b) => {
    const hex = palette.brand[b.tomlKey];
    if (!hex) {
        throw new Error(
            `palette.toml [brand] missing key "${b.tomlKey}" — ` +
            `check submodules/branding/palette/phosphor.toml`,
        );
    }
    return {
        name: b.name,
        desc: b.desc,
        dark: { hex, alias: b.darkAlias },
        light: b.light,
    };
});

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

// Pull only the role keys we render. TOML has additional Material You
// roles (inverse_*, surface_tint, etc.) we don't currently surface;
// filtering keeps the typed RoleMap honest.
const pickRoles = (src: Record<string, string>): RoleMap => {
    const out: RoleMap = {};
    for (const k of ROLE_ORDER) {
        if (src[k] !== undefined) {
            out[k] = src[k];
        }
    }
    return out;
};

export const ROLES_DARK: RoleMap = pickRoles(palette.roles.dark);
export const ROLES_LIGHT: RoleMap = pickRoles(palette.roles.light);

export interface AnsiCell {
    i: number;
    label: string;
    hex: string;
    alias: string;
}

// View-side labels for each ANSI slot. The TOML's [ansi] block keys
// color0…color15 with the conventional label as a comment; the label
// and alias columns we render on the page live here.
const ANSI_LABELS: Array<{ label: string; alias: string }> = [
    { label: "black",    alias: "void" },
    { label: "red",      alias: "rose" },
    { label: "green",    alias: "emerald-500" },
    { label: "yellow",   alias: "amber-400" },
    { label: "blue",     alias: "blue" },
    { label: "magenta",  alias: "purple" },
    { label: "cyan",     alias: "cyan" },
    { label: "white",    alias: "slate-300" },
    { label: "br.black", alias: "slate-800" },
    { label: "br.red",   alias: "rose-400" },
    { label: "br.green", alias: "emerald-400" },
    { label: "br.yell.", alias: "amber-300" },
    { label: "br.blue",  alias: "blue-400" },
    { label: "br.mag.",  alias: "purple-400" },
    { label: "br.cyan",  alias: "cyan-300" },
    { label: "br.white", alias: "slate-100" },
];

export const ANSI: AnsiCell[] = ANSI_LABELS.map((l, i) => {
    const hex = palette.ansi[`color${i}`];
    if (!hex) {
        throw new Error(
            `palette.toml [ansi] missing key "color${i}" — ` +
            `check submodules/branding/palette/phosphor.toml`,
        );
    }
    return { i, label: l.label, hex, alias: l.alias };
});

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
