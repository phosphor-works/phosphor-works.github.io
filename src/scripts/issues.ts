// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// The issues pages (src/pages/issues/): the #help posts that Glim filed as
// GitHub issues, read from the JSON Glim writes beside its kept files on
// issues.phosphor-works.org, and the staff page, whose actions go to Glim's
// staff API behind Cloudflare Access. Every value from the data goes into
// the page through textContent and attributes, never as HTML.

const ISSUES_ORIGIN = "https://issues.phosphor-works.org";

interface KeptFile {
    name: string;
    kind: "image" | "video" | "text" | "file";
    size: number;
    url: string;
    removed?: boolean;
}

interface Post {
    id: string;
    repo: string;
    number: number;
    url: string;
    title: string;
    state: "open" | "closed";
    filed: number;
    updated: number;
    discord: string;
    files: KeptFile[] | number;
}

type Child = Node | string | null | undefined | false;

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes: Record<string, string> = {},
    ...children: Child[]
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    for (const child of children) {
        if (child === null || child === undefined || child === false) continue;
        node.append(child);
    }
    return node;
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
});
const when = (seconds: number) => (seconds ? dateFormat.format(new Date(seconds * 1000)) : "");

function size(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KiB`;
    return `${bytes} B`;
}

function stateChip(post: Post): HTMLElement {
    return el("span", { class: `issue-state issue-state-${post.state}` },
        el("span", { class: "issue-state-mark", "aria-hidden": "true" }),
        post.state === "open" ? "Open" : "Closed");
}

function link(href: string, text: string, external = true): HTMLAnchorElement {
    const attributes: Record<string, string> = { href };
    if (external) Object.assign(attributes, { rel: "noopener noreferrer", target: "_blank" });
    return el("a", attributes, text);
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, { cache: "no-store", credentials: "same-origin", ...init });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((body as { error?: string }).error ?? `${response.status}`);
    return body as T;
}

function showError(root: HTMLElement, message: string) {
    root.replaceChildren(el("p", { class: "issues-error", role: "alert" }, message));
}

// ── The list ──────────────────────────────────────────────────────────────

function renderList(root: HTMLElement, posts: Post[]) {
    const search = document.querySelector<HTMLInputElement>("#issues-search");
    const repo = document.querySelector<HTMLSelectElement>("#issues-repo");
    const state = document.querySelector<HTMLSelectElement>("#issues-state");
    const count = document.querySelector<HTMLElement>("#issues-count");
    if (!search || !repo || !state || !count) return;

    if (repo.options.length <= 1) {
        for (const name of [...new Set(posts.map(p => p.repo))].sort())
            repo.append(el("option", { value: name }, name));
    }
    // The filters live in the address's fragment, so a filtered list can be shared.
    const fromHash = new URLSearchParams(location.hash.slice(1));
    search.value = fromHash.get("q") ?? search.value;
    repo.value = fromHash.get("repo") ?? repo.value;
    state.value = fromHash.get("state") ?? state.value;

    const draw = () => {
        const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
        const shown = posts.filter(p =>
            (!repo.value || p.repo === repo.value)
            && (!state.value || p.state === state.value)
            && words.every(w => `${p.title} ${p.repo}#${p.number}`.toLowerCase().includes(w)));
        const params = new URLSearchParams();
        if (search.value) params.set("q", search.value);
        if (repo.value) params.set("repo", repo.value);
        if (state.value) params.set("state", state.value);
        history.replaceState(null, "", params.toString() ? `#${params}` : location.pathname);
        count.textContent = `${shown.length} of ${posts.length} post${posts.length === 1 ? "" : "s"}`;
        root.replaceChildren(...(shown.length ? shown.map(p =>
            el("li", { class: "issue-row" },
                el("div", { class: "issue-row-head" },
                    stateChip(p),
                    el("a", { class: "issue-title", href: `/post/?id=${encodeURIComponent(p.id)}` }, p.title)),
                el("div", { class: "issue-meta" },
                    link(p.url, `${p.repo}#${p.number}`),
                    el("span", {}, `Filed ${when(p.filed)}`),
                    p.updated !== p.filed && el("span", {}, `Updated ${when(p.updated)}`),
                    typeof p.files === "number" && p.files > 0
                        && el("span", {}, `${p.files} file${p.files === 1 ? "" : "s"}`)))) :
            [el("li", { class: "issues-empty" }, "No post matches.")]));
    };
    for (const control of [search, repo, state]) control.oninput = draw;
    draw();
}

// ── One post ──────────────────────────────────────────────────────────────

function fileItem(file: KeptFile): HTMLElement {
    const caption = el("figcaption", {}, link(file.url, file.name), ` · ${size(file.size)}`);
    if (file.kind === "image")
        return el("figure", { class: "issue-file issue-file-image" },
            el("a", { href: file.url, target: "_blank", rel: "noopener" },
                el("img", { src: file.url, alt: file.name, loading: "lazy" })),
            caption);
    if (file.kind === "video")
        return el("figure", { class: "issue-file issue-file-video" },
            el("video", { src: file.url, controls: "", preload: "metadata" }), caption);
    return el("figure", { class: "issue-file issue-file-other" },
        el("span", { class: "issue-file-icon", "aria-hidden": "true" }, file.kind === "text" ? "📄" : "📦"),
        caption);
}

function renderPost(root: HTMLElement, post: Post) {
    document.title = `${post.title} — Issues — Phosphor`;
    const files = Array.isArray(post.files) ? post.files : [];
    root.replaceChildren(
        el("div", { class: "issue-row-head" }, stateChip(post), el("h1", { class: "issue-heading" }, post.title)),
        el("div", { class: "issue-meta" },
            link(post.url, `${post.repo}#${post.number} on GitHub`),
            link(post.discord, "The post on Discord (members only)"),
            el("span", {}, `Filed ${when(post.filed)}`),
            post.updated !== post.filed && el("span", {}, `Updated ${when(post.updated)}`)),
        files.length
            ? el("section", { class: "issue-files" },
                el("h2", {}, "Files"),
                el("div", { class: "issue-file-grid" }, ...files.map(fileItem)))
            : el("p", { class: "muted" }, "The post had no files that were kept."));
}

// ── Staff ─────────────────────────────────────────────────────────────────

async function act(path: string, note: HTMLElement, after: () => void) {
    note.textContent = "Working…";
    try {
        const answer = await getJson<{ result: string }>(path, { method: "POST", headers: { "X-Glim-Staff": "1" } });
        note.textContent = answer.result;
        after();
    } catch (error) {
        note.textContent = `Not done: ${(error as Error).message}`;
    }
}

function renderStaff(root: HTMLElement, posts: Post[], email: string, reload: () => void) {
    const who = document.querySelector<HTMLElement>("#staff-who");
    if (who) who.textContent = `Signed in as ${email}.`;
    if (!posts.length) {
        root.replaceChildren(el("p", { class: "muted" }, "Glim follows no post."));
        return;
    }
    root.replaceChildren(...posts.map(post => {
        const note = el("p", { class: "staff-note", role: "status" });
        const files = Array.isArray(post.files) ? post.files : [];
        const removeFiles = el("input", { type: "checkbox" });
        const update = el("button", { class: "btn", type: "button" }, "Update from Discord now");
        update.onclick = () => act(`/staff/api/posts/${post.id}/update`, note, reload);
        const unlink = el("button", { class: "btn btn-danger", type: "button" }, "Unlink");
        unlink.onclick = () => {
            if (!confirm(`Stop following "${post.title}"${removeFiles.checked ? " and take its files down" : ""}?`)) return;
            act(`/staff/api/posts/${post.id}/unlink${removeFiles.checked ? "?files=remove" : ""}`, note, reload);
        };
        return el("li", { class: "issue-row staff-row" },
            el("div", { class: "issue-row-head" },
                stateChip(post),
                el("a", { class: "issue-title", href: `/post/?id=${encodeURIComponent(post.id)}` }, post.title)),
            el("div", { class: "issue-meta" },
                link(post.url, `${post.repo}#${post.number}`),
                link(post.discord, "Discord post"),
                el("span", {}, `Updated ${when(post.updated)}`)),
            files.length > 0 && el("ul", { class: "staff-files" }, ...files.map((file, index) => {
                const down = el("button", { class: "btn btn-small btn-danger", type: "button" }, "Take down");
                down.onclick = () => {
                    if (!confirm(`Take down ${file.name}? Its link in the issue stops working.`)) return;
                    act(`/staff/api/posts/${post.id}/files/${index + 1}/remove`, note, reload);
                };
                return el("li", { class: file.removed ? "staff-file staff-file-removed" : "staff-file" },
                    file.removed ? `${file.name} (taken down)` : link(file.url, file.name),
                    ` · ${size(file.size)}`, !file.removed && down);
            })),
            el("div", { class: "staff-actions" },
                update, unlink, el("label", { class: "staff-check" }, removeFiles, " and take its files down")),
            note);
    }));
}

// ── Start ─────────────────────────────────────────────────────────────────

async function start() {
    const root = document.querySelector<HTMLElement>("[data-issues]");
    // Once for each page: this runs as soon as the module does, and again on
    // astro:page-load, which also follows the first load.
    if (!root || root.dataset.issuesStarted) return;
    root.dataset.issuesStarted = "1";
    const page = root.dataset.issues;
    // The pages read the data of the issues site, and only work there.
    if (location.origin !== ISSUES_ORIGIN && location.hostname !== "localhost") {
        const target = { list: "/", post: "/post/", staff: "/staff/" }[page ?? "list"] ?? "/";
        location.replace(`${ISSUES_ORIGIN}${target}${location.search}`);
        return;
    }
    try {
        if (page === "list") {
            const data = await getJson<{ posts: Post[] }>("/api/posts.json");
            renderList(root, data.posts);
        } else if (page === "post") {
            const id = new URLSearchParams(location.search).get("id") ?? "";
            if (!/^[0-9]+$/.test(id)) return showError(root, "No such post.");
            renderPost(root, await getJson<Post>(`/api/p/${id}.json`));
        } else if (page === "staff") {
            const load = async () => {
                const [me, data] = await Promise.all([
                    getJson<{ email: string }>("/staff/api/me"),
                    getJson<{ posts: Post[] }>("/staff/api/posts"),
                ]);
                renderStaff(root, data.posts, me.email, () => void load());
            };
            await load();
        }
    } catch (error) {
        showError(root, page === "post" ? "No such post, or Glim no longer follows it."
            : `The data could not be read: ${(error as Error).message}`);
    }
}

// Module scripts run once the document is parsed: start then, without
// waiting for every image of the page; client-side navigations come back
// through astro:page-load.
void start();
document.addEventListener("astro:page-load", () => void start());
