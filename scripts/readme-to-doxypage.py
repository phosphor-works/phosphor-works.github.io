#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 fuddlesworth
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Translate sibling-repo library READMEs into Doxygen pages.
#
# Each PlasmaZones/libs/phosphor-<slug>/README.md is the source of truth
# for that library's hand-written explanation. Those READMEs are pure
# Markdown so they render cleanly on github.com — they don't carry any
# Doxygen-specific syntax. This script lifts them into the Doxygen
# pipeline by:
#
#   1. Stripping the first `# heading` line (we replace it with @page).
#   2. Prepending `@page lib_phosphor_<slug_with_underscores> phosphor-<slug>`.
#   3. Rewriting sibling-lib links of the form
#      `[X](../phosphor-Y/README.md)` into `@ref lib_phosphor_Y "X"`,
#      so cross-lib links resolve inside the Doxygen output.
#
# The fence preprocessor (preprocess-md-fences.py) runs over the staging
# directory afterwards to rewrite ```<lang>``` blocks for highlight.js.
#
# Usage:
#   readme-to-doxypage.py <PlasmaZones/libs> <staging-dir>

import argparse
import os
import pathlib
import posixpath
import re
import sys


# [X](../phosphor-FOO/README.md) -> @ref lib_phosphor_FOO "X"
# Accepts hyphens in the slug; URL fragment must end with README.md.
# A link to another library's README, from any depth, so links between
# phosphor-libs/libs/ and phosphor-shell-libs/libs/ resolve as well.
_SIBLING_LINK_RE = re.compile(
    r"\[([^\]]+)\]\((?:[./A-Za-z0-9_-]*/)?phosphor-([A-Za-z0-9-]+)/README\.md\)"
)

# Any other Markdown link or image.  Relative targets point into the
# PlasmaZones repo and do not exist in the docs tree, so they are rewritten
# to GitHub: links to the blob view, images to the raw file.
_OTHER_LINK_RE = re.compile(r"(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+\"[^\"]*\")?)\)")
_REPO_BLOB = "https://github.com/fuddlesworth/PlasmaZones/blob/main/"
_REPO_RAW = "https://raw.githubusercontent.com/fuddlesworth/PlasmaZones/main/"


def _rewrite_relative(lib_rel: str | None, body: str) -> str:
    if lib_rel is None:
        return body

    def sub(m: re.Match) -> str:
        bang, label, url, title = m.groups()
        if re.match(r"^([a-z]+:|#|@|/)", url, re.I):
            return m.group(0)
        path, _, frag = url.partition("#")
        target = posixpath.normpath(posixpath.join(lib_rel, path))
        if target.startswith(".."):
            return m.group(0)
        base = _REPO_RAW if bang else _REPO_BLOB
        return f"{bang}[{label}]({base}{target}{'#' + frag if frag else ''}{title})"

    return _OTHER_LINK_RE.sub(sub, body)


def transform(slug: str, text: str, lib_rel: str | None = None) -> str:
    # Drop the first level-1 heading line. The README uses `# phosphor-X`
    # for github.com readers; in Doxygen the @page directive provides the
    # title, so leaving the heading in would render twice.
    lines = text.splitlines()
    stripped = False
    out: list[str] = []
    for line in lines:
        if not stripped and re.match(r"^# [^#]", line):
            stripped = True
            continue
        out.append(line)
    body = "\n".join(out)

    # Cross-lib link rewriting.
    body = _SIBLING_LINK_RE.sub(
        lambda m: f'@ref lib_phosphor_{m.group(2).replace("-", "_")} "{m.group(1)}"',
        body,
    )

    body = _rewrite_relative(lib_rel, body)

    page_id = "lib_phosphor_" + slug.replace("-", "_")
    return f"@page {page_id} phosphor-{slug}\n\n{body.lstrip()}\n"


def _repo_relative(lib_dir: pathlib.Path) -> str | None:
    """The library directory relative to the PlasmaZones checkout, from
    $PHOSPHOR_SRC (exported by build-docs.sh).  None when unknown, in
    which case relative links are left as they are."""
    root = os.environ.get("PHOSPHOR_SRC")
    if not root:
        return None
    try:
        return lib_dir.resolve().relative_to(pathlib.Path(root).resolve()).as_posix()
    except ValueError:
        return None


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Stage lib READMEs as Doxygen @page sources")
    ap.add_argument("src", type=pathlib.Path,
                    help="PlasmaZones/libs directory")
    ap.add_argument("dst", type=pathlib.Path,
                    help="Staging directory (one phosphor-<slug>.md per lib)")
    args = ap.parse_args()

    if not args.src.is_dir():
        print(f"error: {args.src} is not a directory", file=sys.stderr)
        return 1

    args.dst.mkdir(parents=True, exist_ok=True)

    staged = 0
    missing = 0
    for lib_dir in sorted(args.src.iterdir()):
        if not lib_dir.is_dir() or not lib_dir.name.startswith("phosphor-"):
            continue
        readme = lib_dir / "README.md"
        if not readme.is_file():
            print(f"warn: missing {readme}", file=sys.stderr)
            missing += 1
            continue
        slug = lib_dir.name[len("phosphor-"):]
        page = transform(slug, readme.read_text(encoding="utf-8"),
                         _repo_relative(lib_dir))
        (args.dst / f"phosphor-{slug}.md").write_text(page, encoding="utf-8")
        staged += 1

    print(f"staged {staged} library README(s) → {args.dst}"
          + (f"  ({missing} missing)" if missing else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
