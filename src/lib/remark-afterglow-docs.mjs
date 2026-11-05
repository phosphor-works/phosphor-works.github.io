// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Remark plugin for the Afterglow docs mirrored from the
// submodules/afterglow/ checkout.  The files are written for GitHub, so
// this does two things, and only for files under that docs folder:
//
//   1. Pulls the first `# Heading` out of the body and stores it as the
//      page title (the page renders its own title in the hero).
//   2. Rewrites relative links:
//        BUILD.md#x            -> /afterglow/build/#x
//        README.md             -> /afterglow/docs/
//        ../CHANGELOG.md, ../data/...  -> the file on GitHub
//      In-page anchors and absolute URLs are left alone.

const DOCS_DIR = "/submodules/afterglow/docs/";
const REPO_BLOB = "https://github.com/phosphor-works/Afterglow/blob/main/";

function walk(node, fn) {
    fn(node);
    if (node.children) for (const child of node.children) walk(child, fn);
}

function textOf(node) {
    if (node.type === "text" || node.type === "inlineCode") return node.value;
    return (node.children ?? []).map(textOf).join("");
}

export function rewriteAfterglowHref(url) {
    if (!url || url.startsWith("#") || /^[a-z]+:/i.test(url) || url.startsWith("/")) return url;
    const [path, hash = ""] = url.split(/(?=#)/);
    const sibling = path.match(/^(?:\.\/)?([A-Za-z0-9_-]+)\.md$/);
    if (sibling) {
        const name = sibling[1].toLowerCase();
        return (name === "readme" ? "/afterglow/docs/" : `/afterglow/${name}/`) + hash;
    }
    if (path.startsWith("../")) {
        return REPO_BLOB + path.slice(3) + hash;
    }
    return REPO_BLOB + "docs/" + path + hash;
}

export default function remarkAfterglowDocs() {
    return (tree, file) => {
        const filePath = (file.path ?? file.history?.[0] ?? "").replaceAll("\\", "/");
        if (!filePath.includes(DOCS_DIR)) return;

        const h1 = tree.children.findIndex((n) => n.type === "heading" && n.depth === 1);
        if (h1 >= 0) {
            const title = textOf(tree.children[h1]);
            tree.children.splice(h1, 1);
            file.data.astro ??= {};
            file.data.astro.frontmatter ??= {};
            file.data.astro.frontmatter.title = title;
        }

        walk(tree, (node) => {
            if ((node.type === "link" || node.type === "definition") && node.url) {
                node.url = rewriteAfterglowHref(node.url);
            }
        });
    };
}
