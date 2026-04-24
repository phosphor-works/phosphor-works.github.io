// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Drops a "Copy" button into every <pre><code> block at runtime.
// Runs on DOMContentLoaded so it catches install snippets on
// /plasmazones/, guide code blocks, and anywhere else Hljs is used.
// Intentionally light on styling — uses CSS custom properties that
// the global stylesheet already defines so the button theme-flips
// alongside everything else.

function makeButton(label = "Copy"): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-code-btn";
    btn.setAttribute("aria-label", "Copy code");
    btn.textContent = label;
    return btn;
}

function attach(pre: HTMLElement) {
    if (pre.dataset.copyWired === "1") return;
    pre.dataset.copyWired = "1";
    // Marking <pre> as relative-positioned so the absolutely-positioned
    // button can anchor to its top-right.  Harmless if already set.
    if (getComputedStyle(pre).position === "static") {
        pre.style.position = "relative";
    }
    const btn = makeButton();
    btn.addEventListener("click", async () => {
        const text = pre.innerText.replace(/\n+$/, "");
        try {
            await navigator.clipboard.writeText(text);
            btn.textContent = "Copied";
            btn.classList.add("copy-code-btn-ok");
            setTimeout(() => {
                btn.textContent = "Copy";
                btn.classList.remove("copy-code-btn-ok");
            }, 1200);
        } catch {
            btn.textContent = "Failed";
            setTimeout(() => { btn.textContent = "Copy"; }, 1200);
        }
    });
    pre.appendChild(btn);
}

const init = () => {
    document.querySelectorAll<HTMLElement>("pre").forEach(attach);
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
