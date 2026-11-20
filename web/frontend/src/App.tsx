import React, { Suspense, lazy, useState, useEffect, useLayoutEffect, useRef } from "react";

const Map = lazy(() => import("./component/map/Map"));

import "./App.css";
import "./art.css";

import { useGravatar } from "./contexts";
import { DarkModeToggle } from "./component/darkModeToggle/DarkModeToggle";
import { ParticleCanvas } from "./component/particleCanvas/ParticleCanvas";

const socialLinks = [
    { name: "GitHub",    href: "https://www.github.com/dahlke",              external: true },
    { name: "Instagram", href: "https://instagram.com/eklhad",               external: true },
    { name: "X",         href: "https://x.com/neildahlke",                   external: true },
    { name: "Medium",    href: "https://eklhad.medium.com/",                 external: true },
    { name: "LinkedIn",  href: "https://www.linkedin.com/in/neildahlke",     external: true },
    { name: "Strava",    href: "https://www.strava.com/athletes/4351145",    external: true },
    { name: "Résumé",    href: "/static/resume.html",                        external: false },
];

const mapFallback = (
    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-dark-surface">
        <p className="text-xs tracking-widest uppercase text-gray-400 dark:text-slate-600">loading</p>
    </div>
);

// The Go server and Vite both serve index.html for any path, so /map needs no
// router: it renders the same lazy Map chunk full screen.
function MapPage() {
    return (
        <>
            <div className="fixed inset-0">
                <Suspense fallback={mapFallback}>
                    <Map />
                </Suspense>
            </div>
            <DarkModeToggle />
        </>
    );
}

// The home page comes in four styles. "" is Classic, the original serif page;
// the others are set as data-art on <html>, which art.css and the terrain
// canvas both read. The home page opens in Classic; /digital, /impressionist
// and /surrealist open in that style.
const STYLE_PAGES: Record<string, string> = { "/digital": "digital", "/impressionist": "impressionist", "/surrealist": "surrealist" };

// Each art style brings its own fonts. They load when the style is first shown.
// Classic's fonts are in index.html.
const STYLE_FONTS: Record<string, string> = {
    digital: "family=Doto:wght@900&family=IBM+Plex+Mono:wght@400;500",
    impressionist: "family=Cormorant+Garamond:ital,wght@0,500;0,600;1,600",
    surrealist: "family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,600",
};

function loadFonts(style: string) {
    const id = `fonts-${style}`;
    if (!STYLE_FONTS[style] || document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${STYLE_FONTS[style]}&display=swap`;
    document.head.appendChild(link);
}

function App() {
    const path = window.location.pathname.replace(/\/+$/, "");
    if (path === "/map") return <MapPage />;
    return <Home openingStyle={STYLE_PAGES[path] ?? ""} />;
}

// SVG filters that art.css applies to photos: a brushy wobble, and a slow melt
const artFilters = (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="art-impressionist">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="7" />
        </filter>
        <filter id="art-surrealist">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="1" seed="8" />
            <feDisplacementMap in="SourceGraphic" scale="34" />
        </filter>
    </svg>
);

function Home({ openingStyle }: { openingStyle: string }) {
    const [style, setStyle] = useState(openingStyle);
    useLayoutEffect(() => {
        if (style) document.documentElement.dataset.art = style;
        else delete document.documentElement.dataset.art;
        loadFonts(style);
    }, [style]);

    const gravatar = useGravatar();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const hintRef = useRef<HTMLDivElement>(null);

    // Fade is written straight to the DOM once per frame. Setting React state on
    // every scroll event re-rendered the whole page, map included, and made the
    // scroll back up choppy on phones.
    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const desktop = window.innerWidth >= 768;
            const vh = window.innerHeight;
            const raw = (window.scrollY - vh * 0.15) / (vh * 0.45);
            const opacity = desktop ? "1" : String(1 - Math.max(0, Math.min(raw, 1)));
            if (profileRef.current) profileRef.current.style.opacity = opacity;
            if (hintRef.current) hintRef.current.style.opacity = opacity;
            setShowScrollTop(!desktop && window.scrollY > vh * 0.6);
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    return (
        <div className="flex flex-col md:flex-row md:min-h-screen">

            {/* Profile panel — overlays the fixed map on mobile via z-10 */}
            <div
                ref={profileRef}
                className="profile-panel relative min-h-screen md:w-2/5 md:min-h-screen flex flex-col justify-center px-10 md:px-16 py-20 profile-mobile-bg md:bg-off-white md:dark:bg-dark-bg z-10"
            >
                <ParticleCanvas style={style} onStyle={setStyle} />
                <div className="relative z-10 flex flex-col">
                <img
                    className="w-16 h-16 rounded-full mb-10 animate-fade-up"
                    alt="Neil Dahlke"
                    src={gravatar.url || undefined}
                />

                <div className="mb-5 animate-fade-up delay-150">
                    <h1 className="font-serif text-5xl md:text-6xl font-semibold tracking-tight text-chicago-flag-blue dark:text-white leading-none">
                        Neil<br />Dahlke
                    </h1>
                </div>

                <p className="text-sm font-medium text-chicago-flag-blue dark:text-slate-200 mb-1 animate-fade-up delay-300">
                    Human
                </p>

                <p className="text-sm italic text-chicago-flag-blue dark:text-slate-400 mb-10 animate-fade-up delay-300">
                    📍 San Francisco, California
                </p>

                <div className="flex flex-row flex-wrap items-center md:flex-col md:items-start gap-y-2 text-sm tracking-wide text-chicago-flag-blue dark:text-chicago-flag-blue/80 animate-fade-up delay-500">
                    {socialLinks.map((link, i) => (
                        <React.Fragment key={link.name}>
                            <a
                                href={link.href}
                                target={link.external ? "_blank" : undefined}
                                rel={link.external ? "noopener noreferrer" : undefined}
                                className="hover:opacity-50 transition-opacity duration-150"
                            >
                                {link.name}
                            </a>
                            {i < socialLinks.length - 1 && (
                                <span className="md:hidden mx-1.5 text-chicago-flag-blue/30 dark:text-chicago-flag-blue/20 select-none">/</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Scroll hint — mobile only, pinned to the first viewport, hidden on scroll */}
                <div
                    ref={hintRef}
                    className="md:hidden fixed bottom-4 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none animate-bounce"
                >
                    <span className="text-2xl">🌍</span>
                    <svg className="w-4 h-4 text-chicago-flag-blue/60 dark:text-white/40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6l5 5 5-5"/>
                    </svg>
                </div>
                </div>
            </div>

            {/* Map — fixed full-screen behind profile on mobile, sticky column on desktop */}
            <div className="map-pane fixed inset-0 z-0 md:inset-auto md:w-3/5 md:sticky md:top-0 md:h-screen">
                <Suspense fallback={mapFallback}>
                    <Map />
                </Suspense>
            </div>

            {/* Mobile-only spacer — gives the map section its scroll height */}
            <div className="h-screen md:hidden" />

            {showScrollTop && (
                <button
                    className="md:hidden fixed bottom-6 left-6 z-50 bg-black/60 border border-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    aria-label="Back to top"
                >
                    ↑
                </button>
            )}

            {artFilters}
        </div>
    );
}

export default App;
