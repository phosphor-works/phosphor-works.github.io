// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Phosphor syntax themes derived from the Material You palette.
// Single source of truth for the dark/light Shiki/TextMate themes
// loaded by ec.config.mjs — replaces the hand-edited
// phosphor-{dark,light}.jsonc files which had hex values that
// drifted from the palette tokens documented in src/data/palette.ts.
//
// The mapping flows in two stages:
//
//   palette role  ──→  semantic syntax role  ──→  TextMate scopes
//
// e.g.  M3.error  ──→  ROLE.string  ──→  ["string", "string.quoted", …]
//
// Keeping the role mapping explicit (vs. inlining hex per scope)
// makes it obvious which palette token drives which token type, so
// when the brand rose-rose-rose deepens or the surface lightens
// the theme follows automatically.
//
// Token colours mirror the values in src/data/palette.ts so we
// don't have a second source of truth to keep in sync.  If you
// change a hex here, mirror it there (and vice versa).

// ── Palette tokens (mirrors src/data/palette.ts) ─────────────────
const M3 = {
    dark: {
        // Surfaces
        background:           "#050916", // brand-void / surface_container_low
        on_background:        "#E6EDFF",
        surface_variant:      "#1E293B",
        on_surface_variant:   "#94A3B8", // slate-400

        // Brand sweep (cyan → blue → purple → rose)
        primary:              "#3B82F6", // brand blue
        primary_bright:       "#60A5FA", // ANSI br.blue
        secondary:            "#A855F7", // brand purple
        secondary_bright:     "#C084FC", // ANSI br.magenta
        tertiary:             "#22D3EE", // brand cyan
        error:                "#F43F5E", // brand rose

        // ANSI accents used outside the strict M3 role set
        ansi_green:           "#34D399", // ANSI br.green / emerald-400
        muted:                "#64748B", // slate-500 — more subdued than on_surface_variant
    },
    light: {
        // Surfaces
        background:           "#F1F5F9", // slate-100 / surface_container_low
        on_background:        "#050916",
        surface_variant:      "#E2E8F0",
        on_surface_variant:   "#64748B", // slate-500

        // Brand sweep (deeper shades for light-surface contrast)
        primary:              "#3B82F6", // brand blue
        primary_bright:       "#2563EB", // blue-600 (slightly deeper for light bg)
        secondary:            "#7C3AED", // light violet-600
        secondary_bright:     "#9333EA", // purple-600
        tertiary:             "#0891B2", // light cyan-700
        error:                "#E11D48", // light rose-600

        // ANSI accents
        ansi_green:           "#047857", // emerald-700
        muted:                "#94A3B8", // slate-400 (lighter so punct sits behind code)
    },
};

// ── Semantic syntax-role → palette-role mapping ──────────────────
// Each named role here corresponds to one TextMate scope group
// below.  Mapping a role to a different palette token is a single
// edit in this object.
const SYNTAX_ROLE_TO_PALETTE = {
    comment:    "on_surface_variant",  // muted but legible
    keyword:    "secondary",           // brand purple — control-flow keywords
    type:       "tertiary",            // brand cyan — types, classes
    func:       "primary_bright",      // brand blue — function names
    string:     "error",               // brand rose — strings
    number:     "ansi_green",          // emerald — numbers, literals
    preproc:    "secondary_bright",    // softer purple — #include / import
    operator:   "on_surface_variant",  // muted — operators sit behind keywords
    punct:      "muted",               // most subdued — braces, semicolons
    variable:   "on_background",       // body fg — defaults to plain text
    link:       "primary_bright",
    heading:    "secondary",
    attribute:  "tertiary",
    property:   "tertiary",
};

// ── TextMate scope groups under each syntax role ─────────────────
const SCOPES = {
    comment: [
        "comment",
        "punctuation.definition.comment",
        "string.comment",
    ],
    keyword: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "keyword.operator.delete",
        "keyword.operator.expression",
        "storage",
        "storage.modifier",
    ],
    type: [
        "storage.type",
        "support.type",
        "support.class",
        "entity.name.type",
        "entity.name.class",
        "entity.other.inherited-class",
        "variable.language",
        "entity.name.tag",
        "keyword.type",
    ],
    func: [
        "entity.name.function",
        "entity.name.function.member",
        "support.function",
        "support.function.builtin",
        "meta.function-call",
        "variable.function",
    ],
    string: [
        "string",
        "string.quoted",
        "string.quoted.double",
        "string.quoted.single",
        "string.quoted.triple",
        "string.template",
        "string.regexp",
        "entity.name.section",
        "entity.other.attribute-name.id",
        "entity.other.attribute-name.class",
    ],
    number: [
        "constant",
        "constant.numeric",
        "constant.language",
        "constant.character",
        "constant.other",
        "variable.other.constant",
    ],
    preproc: [
        "meta.preprocessor",
        "meta.preprocessor.include",
        "meta.preprocessor.macro",
        "keyword.control.directive",
        "punctuation.definition.directive",
        "entity.name.function.preprocessor",
        "keyword.control.import",
        "keyword.control.export",
        "keyword.control.from",
    ],
    operator: [
        "keyword.operator",
        "keyword.operator.arithmetic",
        "keyword.operator.assignment",
        "keyword.operator.comparison",
        "keyword.operator.logical",
    ],
    punct: [
        "punctuation",
        "punctuation.separator",
        "punctuation.terminator",
        "meta.brace",
    ],
    variable: [
        "variable",
        "variable.parameter",
        "variable.other",
        "support.variable",
    ],
    link: [
        "markup.underline.link",
        "string.other.link",
    ],
    heading: [
        "markup.heading",
    ],
    attribute: [
        "entity.other.attribute-name",
        "meta.attribute.id",
        "meta.attribute.class",
    ],
    property: [
        "support.type.property-name",
        "meta.object-literal.key",
        "support.type.property-name.json",
    ],
};

// Roles that ship a fontStyle (italic comments, bold keywords, etc.)
const FONT_STYLE = {
    comment: "italic",
    keyword: "bold",
    heading: "bold",
    link:    "underline",
};

function buildTheme(name, type) {
    const palette = M3[type];

    const tokenColors = Object.entries(SCOPES).map(([role, scopes]) => {
        const settings = {
            foreground: palette[SYNTAX_ROLE_TO_PALETTE[role]],
        };
        if (FONT_STYLE[role]) {
            settings.fontStyle = FONT_STYLE[role];
        }
        return { scope: scopes, settings };
    });

    // Markup italic / bold are pure font-style overrides (no
    // foreground change).  Keep them after the named-role tokens so
    // they layer on top of any inherited colour.
    tokenColors.push(
        { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
        { scope: ["markup.bold"],   settings: { fontStyle: "bold"   } },
    );

    return {
        name,
        type,
        colors: {
            "editor.background": palette.background,
            "editor.foreground": palette.on_background,
        },
        tokenColors,
    };
}

export const phosphorDark = buildTheme("phosphor-dark", "dark");
export const phosphorLight = buildTheme("phosphor-light", "light");
