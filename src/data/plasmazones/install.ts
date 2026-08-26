// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// The ways to install PlasmaZones, in one place.
//
// Two surfaces render this: the full /plasmazones/install/ page and
// the short teaser block on the /plasmazones/ landing.  They share
// this module rather than each keeping their own copy — a second
// copy is how the portable-tarball URL sat broken
// (fuddlesworth/PlasmaZones#955), and a teaser that quietly disagrees
// with the real instructions is worse than no teaser.
//
// `featured` marks the methods the landing teaser shows. Keep it to
// the two that cover the most people; everything else is one click
// away on the full page.

export interface InstallMethod {
    /** Tab label and heading. */
    label: string;
    /** Short slug for the heading anchor on the install page. */
    id: string;
    /** Upstream package/repo page for this method. */
    href: string;
    /** Link text for `href`. */
    hrefLabel: string;
    /** One-line qualifier shown above the command block. */
    note: string;
    code: string;
    /** Show this method in the landing-page teaser. */
    featured?: boolean;
}

export const INSTALL_METHODS: InstallMethod[] = [
    {
        label: "Arch Linux (AUR)",
        id: "arch",
        href: "https://aur.archlinux.org/packages/plasmazones-bin",
        hrefLabel: "plasmazones-bin on the AUR",
        note: "Prebuilt binary, or plasmazones for the source package.",
        code: `yay -S plasmazones-bin`,
        featured: true,
    },
    {
        label: "Fedora (COPR)",
        id: "fedora",
        href: "https://copr.fedorainfracloud.org/coprs/fuddlesworth/PlasmaZones/",
        hrefLabel: "Official COPR repo",
        note: "Official COPR repo.",
        code: `sudo dnf copr enable fuddlesworth/PlasmaZones
sudo dnf install plasmazones`,
        featured: true,
    },
    {
        label: "openSUSE Tumbleweed (OBS)",
        id: "opensuse",
        href: "https://build.opensuse.org/package/show/home:ilFrance/plasmazones",
        hrefLabel: "OBS package page",
        note: "Community-maintained by ilFrance.",
        code: `sudo zypper addrepo https://download.opensuse.org/repositories/home:ilFrance/openSUSE_Tumbleweed/home:ilFrance.repo
sudo zypper refresh
sudo zypper install plasmazones`,
    },
    {
        label: "Nix",
        id: "nix",
        href: "https://github.com/fuddlesworth/PlasmaZones#nix",
        hrefLabel: "Flake and NixOS module",
        note: "On NixOS, prefer the module — see below. This pins the package to the flake's nixpkgs, so a system KWin update can stop the effect plugin loading until you reinstall.",
        code: `nix profile install github:fuddlesworth/PlasmaZones`,
    },
    {
        label: "Portable tarball",
        id: "tarball",
        href: "https://github.com/fuddlesworth/PlasmaZones/releases/latest",
        hrefLabel: "Latest release",
        note: "Lands in ~/.local. Best for Fedora Atomic or no-root environments.",
        // The release asset carries the version in its filename
        // (plasmazones-3.4.0-linux-x86_64.tar.gz), so there is no
        // stable `/latest/download/<name>` URL to hardcode — the old
        // version-less one 404'd (discussions/955). Resolving the tag
        // from the /releases/latest redirect keeps this correct on
        // every future release without the page being rebuilt, and
        // avoids the api.github.com rate limit a JSON lookup would
        // hit. The extracted directory is NOT versioned, so the final
        // `cd` needs no substitution.
        code: `TAG=$(curl -fsSLI -o /dev/null -w '%{url_effective}' \\
  https://github.com/fuddlesworth/PlasmaZones/releases/latest | sed 's#.*/tag/##')
curl -fL -o plasmazones.tar.gz \\
  "https://github.com/fuddlesworth/PlasmaZones/releases/download/$TAG/plasmazones-\${TAG#v}-linux-x86_64.tar.gz"
tar xzf plasmazones.tar.gz
cd plasmazones-linux-x86_64 && ./install.sh`,
    },
    {
        label: "Build from source",
        id: "source",
        href: "https://github.com/fuddlesworth/PlasmaZones#building-from-source",
        hrefLabel: "Build instructions",
        note: "Add -DUSE_KDE_FRAMEWORKS=OFF for the portable build, which drops the settings KCM and KGlobalAccel shortcuts.",
        code: `git clone https://github.com/fuddlesworth/PlasmaZones.git
cd PlasmaZones
cmake -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr
cmake --build build -j$(nproc)
sudo cmake --install build`,
    },
];

export const FEATURED_METHODS = INSTALL_METHODS.filter(m => m.featured);

/**
 * Runtime and build requirements, mirroring the README's
 * "Requirements" line.  The Qt floor comes from `QT_MIN_VERSION` in
 * PlasmaZones' top-level CMakeLists.txt; the Plasma floor from the
 * 3.3.0 release, which moved the baseline to the 6.7 stack and
 * dropped 6.6.
 */
export const REQUIREMENTS = {
    runtime: [
        "KDE Plasma 6.7 or newer, on Wayland.",
        "KWin compositing with OpenGL — the integration runs as a KWin effect, so it is unavailable under QPainter compositing.",
        "Qt 6.10 or newer.",
    ],
    build: [
        "CMake 3.16+ and a C++20 compiler.",
        "wayland-scanner.",
        "Kirigami, for the settings app — required in every build.",
        "KDE Frameworks 6.26+ (optional) for the settings KCM and KGlobalAccel shortcuts; PlasmaActivities (optional) for activity-based layouts. -DUSE_KDE_FRAMEWORKS=OFF drops both.",
    ],
};

/** Post-install steps, identical for every method above. */
export const POST_INSTALL = `systemctl --user enable --now plasmazones.service
kbuildsycoca6 --noincremental    # KDE only — refresh the service cache`;
