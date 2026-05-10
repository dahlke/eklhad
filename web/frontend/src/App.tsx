import React, { Suspense, lazy, useState, useEffect } from "react";

const Map = lazy(() => import("./component/map/Map"));

import "./App.css";

import { useGravatar } from "./contexts";
import { DarkModeToggle } from "./component/darkModeToggle/DarkModeToggle";

const socialLinks = [
    { name: "GitHub",    href: "https://www.github.com/dahlke",              external: true },
    { name: "Instagram", href: "https://instagram.com/eklhad",               external: true },
    { name: "X",         href: "https://x.com/neildahlke",                   external: true },
    { name: "Medium",    href: "https://eklhad.medium.com/",                 external: true },
    { name: "LinkedIn",  href: "https://www.linkedin.com/in/neildahlke",     external: true },
    { name: "Strava",    href: "https://www.strava.com/athletes/4351145",    external: true },
    { name: "Résumé",    href: "/static/resume.html",                        external: false },
];

function App() {
    const gravatar = useGravatar();
    const [profileOpacity, setProfileOpacity] = useState(1);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            if (window.innerWidth >= 768) { setProfileOpacity(1); setShowScrollTop(false); return; }
            const vh = window.innerHeight;
            const raw = (window.scrollY - vh * 0.15) / (vh * 0.45);
            setProfileOpacity(1 - Math.max(0, Math.min(raw, 1)));
            setShowScrollTop(window.scrollY > vh * 0.6);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    return (
        <div className="flex flex-col md:flex-row md:min-h-screen">

            {/* Profile panel — overlays the fixed map on mobile via z-10 */}
            <div
                className="relative min-h-screen md:w-2/5 md:min-h-screen flex flex-col justify-center px-10 md:px-16 py-20 profile-mobile-bg md:bg-off-white md:dark:bg-dark-bg z-10"
                style={{ opacity: profileOpacity }}
            >
                <img
                    className="w-16 h-16 rounded-full mb-10 animate-fade-up"
                    alt="Neil Dahlke"
                    src={gravatar.url || undefined}
                />

                <div className="mb-5 animate-fade-up delay-150">
                    <h1 className="font-serif text-5xl md:text-6xl font-semibold tracking-tight text-chicago-flag-blue dark:text-white leading-none">
                        Neil<br />Dahlke
                    </h1>
                    <div className="h-px bg-chicago-flag-blue/50 dark:bg-white/20 origin-left animate-draw-line mt-4" />
                </div>

                <p className="text-sm font-medium text-chicago-flag-blue dark:text-slate-200 mb-1 animate-fade-up delay-300">
                    Deployed Engineering Leader
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

                {/* Scroll hint — mobile only, lives in the transparent fade zone */}
                <div className="md:hidden absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none animate-bounce">
                    <span className="text-2xl">🌍</span>
                    <svg className="w-4 h-4 text-chicago-flag-blue/60 dark:text-white/40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6l5 5 5-5"/>
                    </svg>
                </div>
            </div>

            {/* Map — fixed full-screen behind profile on mobile, sticky column on desktop */}
            <div className="fixed inset-0 z-0 md:inset-auto md:w-3/5 md:sticky md:top-0 md:h-screen">
                <Suspense fallback={
                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-dark-surface">
                        <p className="text-xs tracking-widest uppercase text-gray-400 dark:text-slate-600">loading</p>
                    </div>
                }>
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

            <div className={showScrollTop ? 'hidden md:block' : ''}>
                <DarkModeToggle />
            </div>
        </div>
    );
}

export default App;
