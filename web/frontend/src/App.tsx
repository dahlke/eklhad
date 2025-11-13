// Import necessary dependencies
import React, { Suspense, lazy } from "react";
import md5 from "blueimp-md5";

// Lazy load heavy components for code splitting
const Map = lazy(() => import("./component/map/Map"));

// Import styles
import "./App.css";

// Import hooks
import { useGravatar } from "./contexts";

function App() {
    const gravatar = useGravatar();
    // Generate MD5 hash of the gravatar email
    const gravatarEmailMD5 = md5(gravatar.email || "");
    // Construct the Gravatar URL using the MD5 hash
    const gravatarURL = `https://www.gravatar.com/avatar/${gravatarEmailMD5}.jpg`;

    return (
        <div id="app" className="container mx-auto p-4 text-chicago-flag-blue">
            <div className="text-center font-mono w-full md:w-1/2 mx-auto uppercase">
                <div className="block">
                    {/* Profile image */}
                    <img
                        className="w-24 h-24 mx-auto rounded-full"
                        alt="Neil Dahlke"
                        src={gravatarURL}
                    />
                    {/* Name and job title */}
                    <h1 className="pt-5 pb-2 text-3xl font-bold">Neil Dahlke</h1>
                    <h2 className="pb-2">Software Solutions Engineer</h2>
                    <h4 className="pb-2">San Francisco, California, USA</h4>
                    {/* Social media and professional links */}
                    <h5 className="pb-10">
                        <a
                            target="_blank"
                            className="underline"
                            rel="noopener noreferrer"
                            href="https://www.github.com/dahlke"
                        >
                            GitHub
                        </a>
                        {" "}
                        /
                        {" "}
                        <a
                            target="_blank"
                            className="underline"
                            rel="noopener noreferrer"
                            href="https://instagram.com/eklhad"
                        >
                            Instagram
                        </a>
                        {" "}
                        /
                        {" "}
                        <a
                            target="_blank"
                            className="underline"
                            rel="noopener noreferrer"
                            href="https://x.com/neildahlke"
                        >
                            X
                        </a>
                        {" "}
                        /
                        {" "}
                        <a
                            target="_blank"
                            className="underline"
                            rel="noopener noreferrer"
                            href="https://eklhad.medium.com/"
                        >
                            Medium
                        </a>
                        {" "}
                        /
                        {" "}
                        <a
                            target="_blank"
                            className="underline"
                            rel="noopener noreferrer"
                            href="https://www.linkedin.com/in/neildahlke"
                        >
                            LinkedIn
                        </a>
                        {" "}
                        /
                        {" "}
                        <a
                            target="_blank"
                            className="underline"
                            rel="noopener noreferrer"
                            href="https://www.strava.com/athletes/4351145"
                        >
                            Strava
                        </a>
                        {" "}
                        /
                        {' '}
                        <a
                            href="/static/resume.html"
                            className="underline"
                        >
                            Résumé
                        </a>
                    </h5>
                </div>
                {/* Render the map component with lazy loading */}
                <Suspense fallback={
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chicago-flag-blue mx-auto mb-4"></div>
                            <p className="text-sm">Loading map...</p>
                        </div>
                    </div>
                }>
                    <Map />
                </Suspense>
            </div>
        </div>
    );
}

export default App;