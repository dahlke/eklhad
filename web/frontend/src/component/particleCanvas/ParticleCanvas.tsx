import React, { useEffect, useRef, useState } from "react";
// Hashed into /assets/ so a rebake is never served stale from cache
import TERRAIN_URL from "./terrain.bin?url";

/*
 * Places as a dot matrix. Each scene is a height grid plus a landmark drawn as
 * vertical runs of dots, two scenes per place: the Golden Gate (wide, then
 * from Battery Spencer), Chicago (the skyline, then the Bean), Dublin (Howth
 * harbour, then a harp over the bay) and Tahoe City (the shore, then down the lake). The dots morph from one scene to the next on a
 * timer; one button steps its speed or pauses it. Picking a place jumps to it.
 * The controls only appear once someone moves over or taps the panel.
 * Drawing is capped at 30 fps. On low battery, or when the browser asks to
 * save data, it only draws while a scene is changing and rests in between.
 * Dots near the cursor shimmer, and the mesh thins out behind the text.
 * Data comes from terrain.bin, baked by scripts/landmark_terrain.py.
 * Prefers-reduced-motion renders nothing.
 */

// [full name, short name for phones, where four full names don't fit on one row]
const PLACES = [["San Francisco", "SF"], ["Chicago", "Chicago"], ["Dublin", "Dublin"], ["Tahoe City", "Tahoe"]];
// The one speed button steps through these; 0 is paused
const SPEEDS = [1, 2, 0.5, 0];
const SCENE_PLACE = [0, 0, 1, 1, 2, 2, 3, 3]; // which place each baked scene belongs to
const HOLD_MS = 2500;
const MORPH_MS = 1500;
const HOVER_RADIUS = 90;       // px around the cursor that shimmers
const FRAME_MS = 1000 / 30;
const CONTROLS_MS = 4000;      // how long the controls stay after the last movement or tap

const METERS_PER_STEP = 2.5;
const EDGE_FADE = 0.12;        // fraction of the grid that fades out at each side and the back

// Projection. Depth runs from Z_FRONT (row 0) to Z_BACK (last row).
const Z_FRONT = 1;
const Z_BACK = 2.7;
const BACK_WIDTH = 0.6;        // back row spans this many panel widths
const FRONT_GROUND = 1.05;     // where sea level lands for the front row, in panel heights
const BACK_GROUND = 0.3;       // and for the back row
const HORIZON = (BACK_GROUND * Z_BACK - FRONT_GROUND * Z_FRONT) / (Z_BACK - Z_FRONT);
const METER = 0.0011;          // panel heights per meter at depth 1

const SWELL_METERS = 9;

interface FogBlob {
    x: number; y: number;
    rx: number; ry: number;
    alpha: number;
    driftSpeed: number;
    phase: number;
}

interface Scene {
    heights: Float32Array; // meters, 0 = water
    runs: Uint8Array;      // landmark dots: row, col (0-255 across the grid), bottom, top (steps)
    beacons: Uint8Array;   // pulsing lights: row, col, height
    weight: number;        // 0-1, how much of this scene is on screen
}

export function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pickRef = useRef<(place: number) => void>(() => {});
    const [active, setActive] = useState(-1); // -1 until the terrain loads
    const [speed, setSpeed] = useState(0);    // index into SPEEDS
    const [controls, setControls] = useState(false);
    const rateRef = useRef(1);                // cycle speed the draw loop reads; 0 when paused
    rateRef.current = SPEEDS[speed];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        let W = 0;
        let H = 0;
        let raf = 0;
        let rows = 0;
        let cols = 0;
        let scenes: Scene[] = [];
        let cancelled = false;

        let target = 0;                  // scene being morphed toward
        let clock = 0;                   // cycle time: runs at the chosen speed, stops when paused
        let lastSwitch = 0;              // on that clock
        let lastFrame = 0;
        let saver = false;               // saving power: only draw while something is changing
        let stale = true;                // the canvas needs a draw even if nothing is moving
        let drawnDark = false;           // theme of the last draw

        // Cursor in canvas coordinates, off screen when not hovering
        let mouseX = -1e4;
        let mouseY = -1e4;
        let glow: number[] = []; // x, y, strength for each dot near the cursor

        // Soft holes behind the text, so the mesh thins out there
        const mask = document.createElement("canvas");
        const panel = canvas.parentElement;

        const fogBlobs: FogBlob[] = [
            { x: 0.18, y: 0.40, rx: 260, ry: 110, alpha: 0.42, driftSpeed: 0.000008, phase: 0 },
            { x: 0.30, y: 0.58, rx: 300, ry: 120, alpha: 0.40, driftSpeed: 0.000006, phase: 2 },
            { x: 0.16, y: 0.75, rx: 240, ry: 100, alpha: 0.38, driftSpeed: 0.000009, phase: 4 },
            { x: 0.40, y: 0.50, rx: 210, ry:  95, alpha: 0.34, driftSpeed: 0.000007, phase: 1 },
        ];

        // One fill style per (row, water/land/landmark, theme), built once.
        type Styles = [string, string, string];
        let rowStyles: { light: Styles; dark: Styles }[] = [];
        function buildRowStyles() {
            rowStyles = Array.from({ length: rows }, (_, r) => {
                const t = r / (rows - 1);
                const alphas = [0.12 + t * 0.2, 0.28 + t * 0.4, 0.55 + t * 0.4];
                return {
                    light: alphas.map((a) => `rgba(13,17,23,${a})`) as Styles,
                    dark: alphas.map((a) => `rgba(88,185,247,${a})`) as Styles,
                };
            });
        }

        const gradCache = new WeakMap<
            FogBlob,
            { light: CanvasGradient; dark: CanvasGradient }
        >();
        function getBlobGradient(b: FogBlob, dark: boolean) {
            let entry = gradCache.get(b);
            if (!entry) {
                const makeGrad = (a: number, isDark: boolean) => {
                    const grad = ctx!.createRadialGradient(0, 0, 0, 0, 0, b.rx);
                    grad.addColorStop(0, isDark
                        ? `rgba(13,17,23,${a})`
                        : `rgba(232,234,240,${a})`);
                    grad.addColorStop(0.55, isDark
                        ? `rgba(13,17,23,${a * 0.5})`
                        : `rgba(232,234,240,${a * 0.5})`);
                    grad.addColorStop(1, isDark
                        ? "rgba(13,17,23,0)"
                        : "rgba(232,234,240,0)");
                    return grad;
                };
                entry = {
                    light: makeGrad(b.alpha, false),
                    dark: makeGrad(b.alpha * 0.35, true),
                };
                gradCache.set(b, entry);
            }
            return dark ? entry.dark : entry.light;
        }

        // Paint a blurred box over each piece of text. Positions come from layout
        // offsets, so the fade-up animation's transform doesn't skew them.
        function buildMask() {
            if (!panel) return;
            mask.width = canvas!.width;
            mask.height = canvas!.height;
            const mctx = mask.getContext("2d");
            if (!mctx) return;
            const dpr = mask.width / W;
            const far = 20000; // draw off canvas and keep only the blurred shadow
            mctx.shadowColor = "rgba(0,0,0,0.8)";
            mctx.shadowBlur = 14 * dpr;
            mctx.shadowOffsetX = far;
            for (const el of panel.querySelectorAll<HTMLElement>("h1, p, a, img")) {
                let x = 0;
                let y = 0;
                for (let n: HTMLElement | null = el; n && n !== panel; n = n.offsetParent as HTMLElement | null) {
                    x += n.offsetLeft;
                    y += n.offsetTop;
                }
                mctx.fillRect((x - 4) * dpr - far, (y - 2) * dpr, (el.offsetWidth + 8) * dpr, (el.offsetHeight + 4) * dpr);
            }
        }

        function resize() {
            const parent = canvas!.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            // Phone toolbars fire resize on scroll; reallocating an unchanged canvas stutters
            if (rect.width === W && rect.height === H) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = rect.width;
            H = rect.height;
            canvas!.width = Math.round(W * dpr);
            canvas!.height = Math.round(H * dpr);
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
            stale = true;
            buildMask();
        }

        function drawFogBlob(b: FogBlob, now: number, dark: boolean) {
            const x = b.x * W + Math.sin(now * b.driftSpeed + b.phase) * 30;
            const y = b.y * H + Math.cos(now * b.driftSpeed * 0.7 + b.phase) * 12;
            ctx!.save();
            ctx!.translate(x, y);
            ctx!.scale(1, b.ry / b.rx);
            ctx!.beginPath();
            ctx!.arc(0, 0, b.rx, 0, Math.PI * 2);
            ctx!.fillStyle = getBlobGradient(b, dark);
            ctx!.fill();
            ctx!.restore();
        }

        const ease = (w: number) => w * w * (3 - 2 * w);
        const fade = (i: number, n: number) => Math.max(0, Math.min(1, i / ((n - 1) * EDGE_FADE)));

        function go(i: number) {
            target = i;
            lastSwitch = clock;
            setActive(SCENE_PLACE[i]);
        }

        pickRef.current = (p: number) => {
            if (SCENE_PLACE[target] !== p) go(SCENE_PLACE.indexOf(p));
        };

        // Dots near the cursor twinkle: each gets its own phase from `seed`
        function addGlow(x: number, y: number, seed: number, now: number) {
            const d = Math.hypot(x - mouseX, y - mouseY) / HOVER_RADIUS;
            if (d >= 1) return;
            const twinkle = 0.5 + 0.5 * Math.sin(now * 0.012 + seed * 2.399);
            glow.push(x, y, (1 - d) * (1 - d) * (0.35 + 0.65 * twinkle));
        }

        function drawTerrain(now: number, dark: boolean) {
            // Blend weights, eased and normalized so they always sum to 1
            const live = scenes.filter((s) => s.weight > 0);
            const total = live.reduce((sum, s) => sum + ease(s.weight), 0);
            const blend = live.map((s) => ease(s.weight) / total);
            const lead = live[blend.indexOf(Math.max(...blend))];

            const fx = BACK_WIDTH * W * Z_BACK;        // horizontal focal length
            const horizon = HORIZON * H;
            const camY = (FRONT_GROUND - HORIZON) * H * Z_FRONT;
            const meter = METER * H;
            const pan = Math.sin(now * 0.00005) * 0.03;
            const swellPhase = now * 0.0012;

            for (let r = 0; r < rows; r++) {
                const rowFade = fade(rows - 1 - r, rows);
                const inv = 1 / (Z_FRONT + (Z_BACK - Z_FRONT) * (r / (rows - 1)));
                const styles = dark ? rowStyles[r].dark : rowStyles[r].light;
                const base = r * cols;
                for (let pass = 0; pass < 2; pass++) {
                    ctx!.fillStyle = styles[pass];
                    for (let c = 0; c < cols; c++) {
                        const k = base + c;
                        if ((lead.heights[k] > 0 ? 1 : 0) !== pass) continue;
                        const x = W / 2 + (c / (cols - 1) - 0.5 + pan) * fx * inv;
                        if (x < -2 || x > W + 2) continue;
                        // Swell rolls in from the water toward the shore
                        const swell = SWELL_METERS * (
                            Math.sin(r * 0.45 - swellPhase + Math.sin(c * 0.07) * 1.2) * 0.7 +
                            Math.sin(r * 0.17 + c * 0.11 - swellPhase * 0.6) * 0.3
                        );
                        let h = 0;
                        for (let i = 0; i < live.length; i++) {
                            const v = live[i].heights[k];
                            h += blend[i] * (v > 0 ? v : swell);
                        }
                        const y = horizon + (camY - h * meter) * inv;
                        ctx!.globalAlpha = rowFade * fade(Math.min(c, cols - 1 - c), cols);
                        ctx!.fillRect(x, y, 1.1, 1.1);
                        if (Math.abs(x - mouseX) < HOVER_RADIUS) addGlow(x, y, k, now);
                    }
                }
            }

            // Landmarks rise out of the ground as their scene comes in, and sink as it leaves
            for (const s of live) {
                const grow = ease(s.weight);
                const { runs, beacons } = s;
                for (let i = 0; i < runs.length; i += 4) {
                    const rf = runs[i] / 255;
                    const cf = runs[i + 1] / 255;
                    const inv = 1 / (Z_FRONT + (Z_BACK - Z_FRONT) * rf);
                    const x = W / 2 + (cf - 0.5 + pan) * fx * inv;
                    if (x < -2 || x > W + 2) continue;
                    const scale = METERS_PER_STEP * grow * meter * inv;
                    const top = horizon + camY * inv - runs[i + 3] * scale;
                    const bottom = horizon + camY * inv - runs[i + 2] * scale;
                    const styles = rowStyles[Math.round(rf * (rows - 1))];
                    ctx!.fillStyle = (dark ? styles.dark : styles.light)[2];
                    ctx!.globalAlpha = grow * fade((1 - rf) * (rows - 1), rows) *
                        fade(Math.min(cf, 1 - cf) * (cols - 1), cols);
                    const near = Math.abs(x - mouseX) < HOVER_RADIUS;
                    for (let y = top; y <= bottom; y += 2) {
                        ctx!.fillRect(x, y, 1.1, 1.1);
                        if (near) addGlow(x, y, i + y, now);
                    }
                }
                ctx!.fillStyle = dark ? "#fff" : "rgb(46,134,222)";
                const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
                for (let i = 0; i < beacons.length; i += 3) {
                    const inv = 1 / (Z_FRONT + (Z_BACK - Z_FRONT) * (beacons[i] / 255));
                    const x = W / 2 + (beacons[i + 1] / 255 - 0.5 + pan) * fx * inv;
                    const y = horizon + camY * inv - beacons[i + 2] * METERS_PER_STEP * grow * meter * inv;
                    for (const [radius, alpha] of [[6, 0.18], [3, 0.4], [1.3, 1]]) {
                        ctx!.globalAlpha = grow * alpha * (0.3 + 0.7 * pulse);
                        ctx!.beginPath();
                        ctx!.arc(x, y, radius, 0, Math.PI * 2);
                        ctx!.fill();
                    }
                }
            }
            ctx!.globalAlpha = 1;
        }

        function drawGlow(dark: boolean) {
            ctx!.fillStyle = dark ? "#fff" : "rgb(46,134,222)";
            for (let i = 0; i < glow.length; i += 3) {
                const s = glow[i + 2];
                const size = 1.1 + 1.6 * s;
                ctx!.globalAlpha = Math.min(1, s * 1.4);
                ctx!.fillRect(glow[i] - size / 2 + 0.55, glow[i + 1] - size / 2 + 0.55, size, size);
            }
            ctx!.globalAlpha = 1;
            glow = [];
        }

        function draw(now: number) {
            ctx!.clearRect(0, 0, W, H);
            const dark = document.documentElement.classList.contains("dark");
            if (scenes.length) {
                drawTerrain(now, dark);
                drawGlow(dark);
                ctx!.globalCompositeOperation = "destination-out";
                ctx!.drawImage(mask, 0, 0, W, H);
                ctx!.globalCompositeOperation = "source-over";
            }
            for (const b of fogBlobs) drawFogBlob(b, now, dark);
        }

        // Only draw while on screen, so it doesn't compete with the map on phones
        let visible = true;
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
        observer.observe(canvas);

        function tick(now: number) {
            raf = requestAnimationFrame(tick);
            // A little slack so a 60 Hz screen lands on every second frame
            if (!visible || now - lastFrame < FRAME_MS - 4) return;
            const dt = Math.min(100, now - lastFrame) * rateRef.current;
            lastFrame = now;
            clock += dt;
            let moving = false;
            if (scenes.length) {
                if (clock - lastSwitch > MORPH_MS + HOLD_MS) go((target + 1) % scenes.length);
                scenes.forEach((s, i) => {
                    const step = (i === target ? dt : -dt) / MORPH_MS;
                    s.weight = Math.max(0, Math.min(1, s.weight + step));
                    moving = moving || (s.weight > 0 && s.weight < 1);
                });
            }
            const dark = document.documentElement.classList.contains("dark");
            if (!saver || moving || stale || dark !== drawnDark || mouseX > -1e3) {
                draw(now);
                stale = moving;
                drawnDark = dark;
            }
        }

        // Low battery (where the browser reports it) or data saver
        interface Battery extends EventTarget { charging: boolean; level: number }
        const nav = navigator as Navigator & {
            getBattery?: () => Promise<Battery>;
            connection?: { saveData?: boolean };
        };
        const saveData = nav.connection?.saveData === true;
        saver = saveData;
        nav.getBattery?.().then((battery) => {
            const update = () => { saver = saveData || (!battery.charging && battery.level <= 0.2); };
            update();
            battery.addEventListener("levelchange", update);
            battery.addEventListener("chargingchange", update);
        }).catch(() => { /* no battery info */ });

        fetch(TERRAIN_URL)
            .then((res) => res.arrayBuffer())
            .then((buf) => {
                if (cancelled) return;
                const bytes = new Uint8Array(buf);
                rows = bytes[1];
                cols = bytes[2];
                let at = 3;
                for (let s = 0; s < bytes[0]; s++) {
                    const heights = new Float32Array(rows * cols);
                    for (let i = 0; i < heights.length; i++) heights[i] = bytes[at + i] * METERS_PER_STEP;
                    at += rows * cols;
                    const runCount = bytes[at] | (bytes[at + 1] << 8);
                    const runs = bytes.subarray(at + 2, at + 2 + runCount * 4);
                    at += 2 + runCount * 4;
                    const beacons = bytes.subarray(at + 1, at + 1 + bytes[at] * 3);
                    at += 1 + bytes[at] * 3;
                    scenes.push({ heights, runs, beacons, weight: s === 0 ? 1 : 0 });
                }
                buildRowStyles();
                stale = true;
                go(0);
            })
            .catch(() => { /* fog only */ });

        resize();
        raf = requestAnimationFrame(tick);

        // Text can move after first paint, once the web fonts load
        document.fonts?.ready.then(buildMask);

        // The canvas ignores the pointer (it sits under the text), so listen on the panel
        let controlsTimer = 0;
        const wake = () => {
            setControls(true);
            window.clearTimeout(controlsTimer);
            controlsTimer = window.setTimeout(() => setControls(false), CONTROLS_MS);
        };
        const onMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
            wake();
        };
        const onLeave = () => { mouseX = mouseY = -1e4; };
        panel?.addEventListener("mousemove", onMove);
        panel?.addEventListener("mouseleave", onLeave);
        panel?.addEventListener("touchstart", wake, { passive: true });

        window.addEventListener("resize", resize);
        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            observer.disconnect();
            window.removeEventListener("resize", resize);
            panel?.removeEventListener("mousemove", onMove);
            panel?.removeEventListener("mouseleave", onLeave);
            panel?.removeEventListener("touchstart", wake);
            window.clearTimeout(controlsTimer);
            scenes = [];
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full pointer-events-none"
            />
            {active >= 0 && (
                <div className={`absolute top-6 md:top-auto md:bottom-6 left-10 md:left-16 z-20 flex items-baseline gap-3 text-xs tracking-wide text-chicago-flag-blue dark:text-slate-300 transition-opacity duration-500 focus-within:opacity-100 focus-within:pointer-events-auto ${
                    controls ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}>
                    {PLACES.map(([name, short], i) => (
                        <button
                            key={name}
                            onClick={() => pickRef.current(i)}
                            aria-label={name}
                            aria-pressed={i === active}
                            className={`transition-opacity duration-300 ${
                                i === active ? "opacity-100" : "opacity-40 hover:opacity-70"
                            }`}
                        >
                            <span className="md:hidden">{short}</span>
                            <span className="hidden md:inline">{name}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => setSpeed((v) => (v + 1) % SPEEDS.length)}
                        aria-label="Change speed"
                        className="opacity-40 hover:opacity-70"
                    >
                        {SPEEDS[speed] ? `${SPEEDS[speed]}×` : "paused"}
                    </button>
                </div>
            )}
        </>
    );
}
