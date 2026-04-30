import React, { Suspense, lazy } from "react";
import md5 from "blueimp-md5";

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
    const gravatarEmailMD5 = md5(gravatar.email || "");
    const gravatarURL = `https://www.gravatar.com/avatar/${gravatarEmailMD5}.jpg?s=200`;

    return (
        <div className="flex flex-col md:flex-row md:min-h-screen">

            {/* Left — profile panel */}
            <div className="md:w-2/5 md:min-h-screen flex flex-col justify-center px-10 md:px-16 py-20 bg-off-white dark:bg-dark-bg">

                <img
                    className="w-16 h-16 rounded-full mb-10 animate-fade-up"
                    alt="Neil Dahlke"
                    src={gravatarURL}
                />

                {/* Name + drawing line */}
                <div className="mb-5 animate-fade-up delay-150">
                    <h1 className="font-serif text-5xl md:text-6xl font-semibold tracking-tight text-chicago-flag-blue dark:text-white leading-none">
                        Neil<br />Dahlke
                    </h1>
                    <div className="h-px bg-chicago-flag-blue/50 dark:bg-white/20 origin-left animate-draw-line mt-4" />
                </div>

                <p className="text-sm font-medium text-chicago-flag-blue dark:text-slate-200 mb-1 animate-fade-up delay-300">
                    Deployed Engineering Leader
                </p>

                <p className="text-sm text-chicago-flag-blue/70 dark:text-slate-500 mb-10 animate-fade-up delay-300">
                    San Francisco, California
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
            </div>

            {/* Right — map */}
            <div className="md:w-3/5 md:sticky md:top-0 md:h-screen">
                <Suspense fallback={
                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-dark-surface">
                        <p className="text-xs tracking-widest uppercase text-gray-400 dark:text-slate-600">loading</p>
                    </div>
                }>
                    <Map />
                </Suspense>
            </div>

            <DarkModeToggle />
        </div>
    );
}

export default App;
