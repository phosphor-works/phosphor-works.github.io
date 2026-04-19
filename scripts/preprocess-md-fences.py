#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 fuddlesworth
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Preprocess Markdown fenced code blocks so highlight.js can syntax-highlight
# them in the Doxygen output.
#
# Problem:
#   Doxygen's markdown handler converts ```<lang>``` fences into
#   <div class="fragment"><div class="line">...</div></div> — language
#   annotation is stripped.  highlight.js needs a `language-X` class to
#   know what to highlight.
#
# Solution:
#   Rewrite each fence as @htmlonly with a <div class="fragment"> wrapping
#   <pre><code class="hljs language-X">...</code></pre>.  Doxygen passes
#   the HTML through verbatim, the outer `div.fragment` keeps the
#   doxygen-awesome copy-button active, and the inner `code.language-X`
#   lets highlight.js pick the right grammar at load time.
#
# Usage:
#   preprocess-md-fences.py <src-dir> <dst-dir>
#
# Walks every *.md under src-dir, writes preprocessed copies under dst-dir
# (mirroring filenames; does NOT recurse subdirectories, flat copy only).

import argparse
import html
import pathlib
import re
import sys


# Triple-backtick fenced code blocks.  Language tag is optional; we default
# to empty so blocks with no language still pass through.  Non-greedy body
# match with re.DOTALL.
_FENCE_RE = re.compile(
    r"^```([A-Za-z0-9_+\-]*)\s*\n(.*?)\n```\s*$",
    re.DOTALL | re.MULTILINE,
)


def rewrite_fence(match: re.Match[str]) -> str:
    lang = (match.group(1) or "").strip().lower()
    body = match.group(2)

    # HTML-escape the body so < > & don't get interpreted by doxygen or
    # the browser.  Keep trailing newline stripped.
    escaped = html.escape(body)

    # <div class="fragment">   — doxygen-awesome copy button + our themed bg
    # <pre><code class="hljs language-X"> — highlight.js target
    # The explicit `hljs` class matches the one highlight.js adds itself
    # after highlighting; pre-adding it lets our CSS handle the
    # before-highlight state the same way.
    lang_class = f"language-{lang}" if lang else ""

    return (
        "@htmlonly\n"
        f'<div class="fragment hljs-fragment">'
        f'<pre><code class="hljs {lang_class}">'
        f"{escaped}"
        "</code></pre>"
        "</div>\n"
        "@endhtmlonly\n"
    )


def preprocess_file(src: pathlib.Path, dst: pathlib.Path) -> int:
    """Rewrite one md file; returns number of fences rewritten."""
    text = src.read_text(encoding="utf-8")
    rewritten, n = _FENCE_RE.subn(rewrite_fence, text)
    dst.write_text(rewritten, encoding="utf-8")
    return n


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Rewrite markdown fenced code blocks for highlight.js")
    ap.add_argument("src", type=pathlib.Path, help="source directory of *.md")
    ap.add_argument("dst", type=pathlib.Path, help="destination directory")
    args = ap.parse_args()

    if not args.src.is_dir():
        print(f"error: source {args.src} is not a directory", file=sys.stderr)
        return 1

    args.dst.mkdir(parents=True, exist_ok=True)

    total_files = 0
    total_fences = 0
    for src_path in sorted(args.src.glob("*.md")):
        dst_path = args.dst / src_path.name
        n = preprocess_file(src_path, dst_path)
        total_files += 1
        total_fences += n

    print(f"preprocessed {total_files} md file(s), {total_fences} fence(s) → {args.dst}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
