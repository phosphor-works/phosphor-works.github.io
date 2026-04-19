#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 fuddlesworth
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Convert D-Bus introspection XML to Doxygen-friendly Markdown pages.
#
# Usage:
#   scripts/dbus-to-doxygen.py <input-dir> <output-dir>
#
# Reads every *.xml under <input-dir>/ (PlasmaZones3/dbus/ by default) and
# emits one .md page per interface under <output-dir>/, plus an index page
# that doxygen picks up as the /api/html/dbus_apis.html landing.
#
# XML conventions assumed (match PlasmaZones3's dbus/*.xml):
#   <interface name="org.plasmazones.Foo">
#     <annotation name="org.gtk.GDBus.DocString" value="..."/>
#     <method name="bar">
#       <annotation name="org.gtk.GDBus.DocString" value="..."/>
#       <arg name="x" type="s" direction="in">
#         <annotation name="org.gtk.GDBus.DocString" value="..."/>
#       </arg>
#     </method>
#     <signal name="baz">...</signal>
#     <property name="qux" type="i" access="readwrite">...</property>
#   </interface>
#
# No runtime deps — stdlib xml.etree only.

import argparse
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

# Some PlasmaZones .xml files contain `--` sequences inside HTML-style
# <!-- ... -->  comment blocks (e.g. the text `--page`).  That's technically
# an XML spec violation (double-dashes can't appear inside a comment) and
# strict parsers like xml.etree reject the whole document.  Comments are
# discardable for our purposes, so strip them outright before parsing.
_XML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)

# D-Bus single-letter type codes → human name.
DBUS_SIG_NAMES = {
    "y": "byte",       "b": "bool",       "n": "int16",
    "q": "uint16",     "i": "int32",      "u": "uint32",
    "x": "int64",      "t": "uint64",     "d": "double",
    "s": "string",     "o": "object_path", "g": "signature",
    "v": "variant",    "h": "unix_fd",
}

GDBUS_DOC = "org.gtk.GDBus.DocString"
FREEDESKTOP_DOC = "org.freedesktop.DBus.Description"  # also widely used


def sig_to_human(sig: str) -> str:
    """Turn a D-Bus type signature into a best-effort human-readable form.

    Examples:
        s           → string
        as          → array<string>
        a{sv}       → dict<string,variant>
        (sii)       → struct(string,int32,int32)
        a(sv)       → array<struct(string,variant)>
    """
    if not sig:
        return ""

    def decode(chars, i):
        if i >= len(chars):
            return "", i
        c = chars[i]
        if c == "a":
            inner, j = decode(chars, i + 1)
            if inner.startswith("dict-entry{"):
                # a{...} → dict
                return f"dict<{inner[len('dict-entry{'):-1]}>", j
            return f"array<{inner}>", j
        if c == "(":
            parts = []
            j = i + 1
            while j < len(chars) and chars[j] != ")":
                item, j = decode(chars, j)
                parts.append(item)
            return f"struct({','.join(parts)})", j + 1
        if c == "{":
            # dict-entry {kt vt}
            parts = []
            j = i + 1
            while j < len(chars) and chars[j] != "}":
                item, j = decode(chars, j)
                parts.append(item)
            return f"dict-entry{{{','.join(parts)}}}", j + 1
        return DBUS_SIG_NAMES.get(c, c), i + 1

    human, _ = decode(sig, 0)
    return human


def docstring(elem: ET.Element) -> str:
    """Extract an org.gtk.GDBus.DocString (or similar) annotation's value."""
    for ann in elem.findall("annotation"):
        name = ann.get("name", "")
        if name in (GDBUS_DOC, FREEDESKTOP_DOC):
            return ann.get("value", "").strip()
    return ""


def page_anchor(iface_name: str) -> str:
    """Turn 'org.plasmazones.Settings' into a Doxygen-safe \\page anchor."""
    return "iface_" + iface_name.replace(".", "_")


def render_args(args: list[ET.Element], default_direction: str) -> str:
    """Render a method/signal arg list as a Markdown table.  Returns empty
    string if there are no args — caller formats the section accordingly."""
    if not args:
        return ""
    lines = [
        "| Arg | Direction | Type | Description |",
        "|-----|-----------|------|-------------|",
    ]
    for arg in args:
        name = arg.get("name", "_")
        direction = arg.get("direction", default_direction)
        sig = arg.get("type", "")
        type_cell = f"`{sig}` *({sig_to_human(sig)})*" if sig else ""
        desc = docstring(arg).replace("\n", " ")
        lines.append(f"| `{name}` | {direction} | {type_cell} | {desc} |")
    return "\n".join(lines)


def render_interface(iface: ET.Element, source_file: str) -> str:
    """Render one <interface> element as a Doxygen Markdown page body."""
    name = iface.get("name", "<unknown>")
    desc = docstring(iface)
    anchor = page_anchor(name)
    methods = iface.findall("method")
    signals = iface.findall("signal")
    properties = iface.findall("property")

    out = [f"# {name} {{#{anchor}}}", ""]
    if desc:
        out.append(desc)
        out.append("")

    out += [
        "| | |",
        "|---|---|",
        f"| **Well-known name** | `{name}` |",
        f"| **Source XML**      | [`{source_file}`](https://github.com/fuddlesworth/PlasmaZones/blob/main/dbus/{source_file}) |",
        f"| **Methods**         | {len(methods)} |",
        f"| **Signals**         | {len(signals)} |",
        f"| **Properties**      | {len(properties)} |",
        "",
    ]

    if methods:
        out.append("## Methods")
        out.append("")
        for m in methods:
            mname = m.get("name", "?")
            mdoc = docstring(m)
            out.append(f"### `{mname}()` {{#{anchor}_m_{mname}}}")
            out.append("")
            if mdoc:
                out.append(mdoc)
                out.append("")
            args = m.findall("arg")
            table = render_args(args, default_direction="in")
            if table:
                out.append(table)
            else:
                out.append("*No arguments.*")
            out.append("")

    if signals:
        out.append("## Signals")
        out.append("")
        for s in signals:
            sname = s.get("name", "?")
            sdoc = docstring(s)
            out.append(f"### `{sname}` {{#{anchor}_s_{sname}}}")
            out.append("")
            if sdoc:
                out.append(sdoc)
                out.append("")
            args = s.findall("arg")
            table = render_args(args, default_direction="out")
            if table:
                out.append(table)
            else:
                out.append("*No payload.*")
            out.append("")

    if properties:
        out.append("## Properties")
        out.append("")
        out += [
            "| Property | Access | Type | Description |",
            "|----------|--------|------|-------------|",
        ]
        for p in properties:
            pname = p.get("name", "?")
            access = p.get("access", "readwrite")
            sig = p.get("type", "")
            type_cell = f"`{sig}` *({sig_to_human(sig)})*" if sig else ""
            desc = docstring(p).replace("\n", " ")
            out.append(f"| `{pname}` | {access} | {type_cell} | {desc} |")
        out.append("")

    return "\n".join(out)


def render_index(interfaces: list[tuple[str, str, str]]) -> str:
    """Landing page (#dbus_apis) linking every interface.

    Each entry: (interface_name, source_xml_filename, short_description).

    Uses @subpage in a PROSE LIST (not table cells — @ directives don't
    get processed inside markdown table cells in doxygen 1.16) so the
    nav tree establishes a parent/child relationship: "D-Bus APIs" in
    the sidebar becomes a collapsible folder whose children are the
    individual interface pages.  The table below the subpage list
    carries the same info plus source file + summary, and uses @ref
    for simple cross-links (since we already established the hierarchy
    above).
    """
    sorted_ifaces = sorted(interfaces)
    out = [
        "# D-Bus APIs {#dbus_apis}",
        "",
        "Every D-Bus interface PlasmaZones exposes on the session bus.  "
        "Pages generated from the introspection XMLs under "
        "[`dbus/*.xml`](https://github.com/fuddlesworth/PlasmaZones/tree/main/dbus) "
        "by `scripts/dbus-to-doxygen.py`; interface-level changes flow into "
        "docs on the next `build-docs.sh` run.",
        "",
        "## Interfaces",
        "",
    ]
    # @subpage directives — one per interface — as a bulleted list.
    # This is the form that registers each page as a CHILD of dbus_apis
    # in the sidebar treeview.  Doxygen renders each @subpage as a link
    # with the child page's title as the display text.
    for name, _xml_file, _summary in sorted_ifaces:
        anchor = page_anchor(name)
        out.append(f"- @subpage {anchor}")
    out.append("")

    # Reference table: same info at a glance, with source XML + summary
    # columns that the simple subpage list can't carry.
    out += [
        "## Reference",
        "",
        "| Interface | Source | Summary |",
        "|-----------|--------|---------|",
    ]
    for name, xml_file, summary in sorted_ifaces:
        anchor = page_anchor(name)
        summary_safe = summary.replace("|", chr(92) + chr(124)) or "—"
        out.append(
            f"| [{name}](@ref {anchor}) | `{xml_file}` | {summary_safe} |"
        )
    out.append("")
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Convert D-Bus introspection XML to Doxygen Markdown pages.")
    ap.add_argument("input_dir",  type=pathlib.Path, help="directory of *.xml files")
    ap.add_argument("output_dir", type=pathlib.Path, help="where to write *.md pages")
    args = ap.parse_args()

    if not args.input_dir.is_dir():
        print(f"error: {args.input_dir} is not a directory", file=sys.stderr)
        return 1

    args.output_dir.mkdir(parents=True, exist_ok=True)

    xmls = sorted(args.input_dir.glob("*.xml"))
    if not xmls:
        print(f"warning: no *.xml files under {args.input_dir}", file=sys.stderr)
        return 0

    interfaces: list[tuple[str, str, str]] = []
    for xml_path in xmls:
        raw = xml_path.read_text(encoding="utf-8")
        stripped = _XML_COMMENT_RE.sub("", raw)
        try:
            root = ET.fromstring(stripped)
        except ET.ParseError as e:
            print(f"error parsing {xml_path}: {e}", file=sys.stderr)
            continue

        # Root is usually <node>; interfaces may live directly under it or
        # nested inside <node><interface>.  Walk anything that matches.
        for iface in root.iter("interface"):
            name = iface.get("name", "")
            if not name:
                continue
            md_body = render_interface(iface, xml_path.name)
            out_file = args.output_dir / f"{name}.md"
            out_file.write_text(md_body, encoding="utf-8")
            summary = docstring(iface).split(".")[0] if docstring(iface) else ""
            interfaces.append((name, xml_path.name, summary))

    (args.output_dir / "index.md").write_text(render_index(interfaces), encoding="utf-8")
    print(f"generated {len(interfaces)} interface page(s) + index at {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
