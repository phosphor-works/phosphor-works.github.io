// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Thin Pagefind client.  The index lives at /pagefind/ (built by the
// astro-pagefind integration); we dynamic-import it on first search
// so the ~50KB JS + WASM only loads when the user actually searches.
//
// Keyboard contract:
//   - "/" anywhere (outside an input) opens the dialog.
//   - Esc closes the dialog (native <dialog> behavior).
//   - ↑/↓ cycle results; Enter opens the focused result.

type PagefindResult = {
    id: string;
    data: () => Promise<{
        url: string;
        meta: { title?: string };
        excerpt: string;
    }>;
};

type Pagefind = {
    search: (query: string) => Promise<{ results: PagefindResult[] }>;
};

let pagefind: Pagefind | null = null;
let loadPromise: Promise<Pagefind | null> | null = null;

// Lazy-import Pagefind.  /pagefind/pagefind.js is emitted by the
// astro-pagefind integration into dist/pagefind/, so it doesn't
// exist during `astro dev` or at Vite analysis time.  Vite 6
// rejects absolute-URL dynamic imports even with /* @vite-ignore */,
// so we wrap in `new Function` to opt out of static analysis
// entirely — the browser still resolves it normally at runtime.
// Failures (dev mode, network) are swallowed so the UI stays usable.
const importPagefind: () => Promise<unknown> = new Function(
    "return import('/pagefind/pagefind.js')"
) as () => Promise<unknown>;

async function getPagefind(): Promise<Pagefind | null> {
    if (pagefind) return pagefind;
    if (!loadPromise) {
        loadPromise = importPagefind()
            .then(mod => {
                pagefind = mod as Pagefind;
                return pagefind;
            })
            .catch(() => null);
    }
    return loadPromise;
}

export function initSearch(): void {
    const root = document.querySelector<HTMLElement>(".site-search");
    if (!root) return;
    const trigger = root.querySelector<HTMLButtonElement>(".site-search-trigger");
    const dialog = root.querySelector<HTMLDialogElement>(".site-search-dialog");
    const input  = root.querySelector<HTMLInputElement>(".site-search-input");
    const list   = root.querySelector<HTMLElement>(".site-search-results");
    const closeBtn = root.querySelector<HTMLButtonElement>(".site-search-close");
    if (!trigger || !dialog || !input || !list || !closeBtn) return;

    let activeIndex = -1;

    const openDialog = () => {
        if (!dialog.open) dialog.showModal();
        requestAnimationFrame(() => input.focus());
    };
    const closeDialog = () => {
        if (dialog.open) dialog.close();
    };

    const renderResults = (items: Array<{ url: string; title: string; excerpt: string }>) => {
        if (items.length === 0) {
            list.innerHTML = `<div class="empty">No results.</div>`;
            activeIndex = -1;
            return;
        }
        list.innerHTML = items
            .map((r, i) => `
                <a class="result" href="${r.url}" data-idx="${i}" ${i === 0 ? 'aria-selected="true"' : ""}>
                    <span class="result-title">${escapeHtml(r.title || r.url)}</span>
                    <span class="result-excerpt">${r.excerpt}</span>
                </a>`)
            .join("");
        activeIndex = 0;
    };

    const runSearch = async (q: string) => {
        const pf = await getPagefind();
        if (!pf) {
            list.innerHTML = `<div class="empty">Search index is not available in dev. Run <code>npm run build</code> and <code>npm run preview</code>.</div>`;
            return;
        }
        const { results } = await pf.search(q);
        const hydrated = await Promise.all(
            results.slice(0, 10).map(async r => {
                const d = await r.data();
                return {
                    url: d.url,
                    title: d.meta.title ?? d.url,
                    excerpt: d.excerpt,
                };
            })
        );
        renderResults(hydrated);
    };

    const debounce = <A extends unknown[]>(fn: (...a: A) => void, ms: number) => {
        let t: ReturnType<typeof setTimeout> | undefined;
        return (...a: A) => {
            if (t) clearTimeout(t);
            t = setTimeout(() => fn(...a), ms);
        };
    };
    const debouncedSearch = debounce((q: string) => { void runSearch(q); }, 120);

    const moveActive = (delta: number) => {
        const items = list.querySelectorAll<HTMLElement>(".result");
        if (items.length === 0) return;
        activeIndex = (activeIndex + delta + items.length) % items.length;
        items.forEach((el, i) => {
            if (i === activeIndex) {
                el.setAttribute("aria-selected", "true");
                el.focus();
            } else {
                el.removeAttribute("aria-selected");
            }
        });
    };

    trigger.addEventListener("click", openDialog);
    closeBtn.addEventListener("click", closeDialog);

    input.addEventListener("input", () => {
        const q = input.value.trim();
        if (!q) { list.innerHTML = ""; activeIndex = -1; return; }
        debouncedSearch(q);
    });

    dialog.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
        else if (e.key === "Enter") {
            const items = list.querySelectorAll<HTMLAnchorElement>(".result");
            if (activeIndex >= 0 && items[activeIndex]) {
                items[activeIndex].click();
            }
        }
    });

    // "/" opens the dialog from anywhere outside an input/textarea.
    document.addEventListener("keydown", (e) => {
        if (e.key !== "/") return;
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
        if (dialog.open) return;
        e.preventDefault();
        openDialog();
    });

    // Cross-site hand-off: the doxygen topbar links to "…/#search" (or
    // "…/#search=query") to open site search from an /api/html/* page
    // that can't host Pagefind itself.  On arrival, auto-open; if a
    // query is present, prefill and fire the first search.
    const handleHash = () => {
        const h = location.hash;
        if (!h || !h.startsWith("#search")) return;
        openDialog();
        const eq = h.indexOf("=");
        if (eq !== -1) {
            const q = decodeURIComponent(h.slice(eq + 1));
            if (q) {
                input.value = q;
                debouncedSearch(q);
            }
        }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Module-level Escape handler.  Bound ONCE so it doesn't accumulate
// across Astro view-transitions, and on `document` (not the dialog)
// so it fires regardless of where focus currently is — a result
// link, the body, the input, anywhere.  Capture phase ensures we
// run before any descendant handler can stopPropagation, including
// Chromium's <input type="search"> Escape clear-value behavior
// which both preventDefault's AND stopPropagation's the keydown.
if (typeof document !== "undefined") {
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const dialog = document.querySelector<HTMLDialogElement>(".site-search-dialog");
        if (!dialog?.open) return;
        e.preventDefault();
        e.stopPropagation();
        dialog.close();
    }, true);
}
