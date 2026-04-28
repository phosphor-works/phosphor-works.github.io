// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// /rss.xml — Atom-friendly RSS 2.0 feed for the news collection.
// Autodiscovery is wired from the news index via <link rel="alternate"
// type="application/rss+xml">; feed readers (NetNewsWire, Feedbro,
// Thunderbird, FreshRSS, Miniflux) pick it up from there.

import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET(context: APIContext) {
    const posts = (await getCollection("news", ({ data }) => !data.draft))
        .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    return rss({
        title: "Phosphor — News",
        description:
            "Release notes, announcements, and project updates for the "
            + "Phosphor Qt6/Wayland library suite and PlasmaZones.",
        // context.site is set by astro.config.mjs ("https://phosphor-works.github.io").
        // rss() throws if it's missing, so we surface a clear error early
        // instead of letting the integration fail with a stack trace.
        site: context.site ?? "https://phosphor-works.github.io",
        items: posts.map(post => ({
            title: post.data.title,
            pubDate: post.data.date,
            description: post.data.summary,
            link: `/news/${post.id}/`,
            // Categorises entries in readers that surface tags
            // (release / post / announcement).
            categories: [
                post.data.kind,
                ...(post.data.version ? [post.data.version] : []),
            ],
        })),
        // Feed-level styling hint and a stylesheet would go here if we
        // ever ship a friendly /rss.xsl.  Plain RSS is fine for now.
        customData: "<language>en-us</language>",
    });
}
