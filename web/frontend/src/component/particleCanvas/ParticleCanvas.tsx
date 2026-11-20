import React, { useEffect, useRef, useState } from "react";
import { useDarkMode } from "../../contexts";
// Hashed into /assets/ so a rebake is never served stale from cache
import TERRAIN_URL from "./terrain.bin?url";

/*
 * Places as a dot matrix. Each scene is a height grid plus a landmark drawn as
 * vertical runs of dots, two scenes per place: the Golden Gate (wide, then
 * from Battery Spencer), Chicago (the skyline, then the Bean), Dublin (Howth
 * harbour, then a harp over the bay) and Tahoe City (the shore, then down the lake). The dots morph from one scene to the next on a
 * timer. A small "view" button opens one bar with every choice: the place,
 * the style, light or dark, and the speed.
 * Drawing runs at 30 fps while a scene changes and 15 fps between. On low battery, or when the browser asks to
 * save data, it only draws while a scene is changing and rests in between.
 * Dots near the cursor shimmer, and the mesh thins out behind the text.
 * Data comes from terrain.bin, baked by scripts/landmark_terrain.py.
 * Prefers-reduced-motion renders nothing.
 *
 * The page comes in three styles, each with a light and a dark version. The
 * art styles set data-art on <html> (see App.tsx). The same
 * scenes are then painted as dabs of color under a low sun, or in desert
 * colors with dripping dots, melting landmarks and a soft clock.
 */

// [full name, short name for narrow panels, where four full names don't fit on one row]
const PLACES = [["San Francisco", "SF"], ["Chicago", "Chicago"], ["Dublin", "Dublin"], ["Tahoe City", "Tahoe"]];
const STYLE_NAMES = [["", "Classic"], ["digital", "Digital"], ["impressionist", "Impressionist"], ["surrealist", "Surrealist"]];
const SPEEDS = [[0.5, "0.5×"], [1, "1×"], [2, "2×"], [0, "Pause"]] as const;
const SCENE_PLACE = [0, 0, 1, 1, 2, 2, 3, 3]; // which place each baked scene belongs to
const HOLD_MS = 2500;
const MORPH_MS = 1500;
const HOVER_RADIUS = 90;       // px around the cursor that shimmers
const FRAME_MS = 1000 / 30;      // while a scene is changing or the cursor is over the panel
const IDLE_FRAME_MS = 1000 / 15; // between changes, when only the water moves

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

// Colors for the art styles, light and dark: water, land, landmarks, and the lights
const ART = {
    impressionist: {
        light: {
            water: ["#7fa8d6", "#a9c3e6", "#8fb7c9", "#c3b6e0", "#f2d9c2"],
            land: ["#5f8f5a", "#8fb26b", "#3f6f7a", "#b08fc2", "#e8b98a"],
            mark: ["#2f3f8f", "#4b3f7a", "#1f5f6f", "#c2553f"],
            light: "#f2773c",
        },
        dark: {
            water: ["#3f5fa8", "#5b78c2", "#2f4a8a", "#7a6fc2", "#c2a36a"],
            land: ["#2f6f5a", "#4f8f6b", "#245a6a", "#7a5fa8", "#d9a85a"],
            mark: ["#f2d98a", "#e8b06a", "#bfd0f2", "#f29a6a"],
            light: "#f2c94c",
        },
    },
    surrealist: {
        light: {
            water: ["#5fb8c2", "#3f9aa8", "#8fd0d4"],
            land: ["#c99a6a", "#b8774a", "#a8603f", "#d2b483"],
            mark: ["#3a2a1a", "#5a2f1a", "#c2402a"],
            light: "#3a2a1a",
        },
        dark: {
            water: ["#2a8a8f", "#1f6f7a", "#3fa3a0"],
            land: ["#d2b483", "#c99a6a", "#b8774a", "#e0cba6"],
            mark: ["#fff5dc", "#f2e6c8", "#e8572f"],
            light: "#fff5dc",
        },
    },
};
type Art = keyof typeof ART | undefined;

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

export function ParticleCanvas({ style, onStyle }: { style: string; onStyle: (style: string) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pickRef = useRef<(place: number) => void>(() => {});
    const [active, setActive] = useState(-1); // -1 until the terrain loads
    const [speed, setSpeed] = useState(1);    // index into SPEEDS
    const [open, setOpen] = useState(false);  // the bar of choices
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const maskRef = useRef<() => void>(() => {});
    const rateRef = useRef(1);                // cycle speed the draw loop reads; 0 when paused
    rateRef.current = SPEEDS[speed][0];

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
        let busy = true;                 // draw at the full frame rate

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
            if (!panel || !W) return;
            stale = true;
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
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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

        // Dots are collected per color and opacity step, then each group is filled
        // as one path. Thousands of separate fills were the bulk of the frame cost.
        const LEVELS = 12;
        const buckets: number[][] = [];
        function put(color: number, alpha: number, x: number, y: number, w: number, h: number) {
            if (alpha <= 0.02) return;
            const key = color * LEVELS + Math.min(LEVELS - 1, Math.floor(alpha * LEVELS));
            (buckets[key] ??= []).push(x, y, w, h);
        }
        function flush(colors: string[]) {
            for (let key = 0; key < buckets.length; key++) {
                const rects = buckets[key];
                if (!rects?.length) continue;
                ctx!.fillStyle = colors[Math.floor(key / LEVELS)];
                ctx!.globalAlpha = ((key % LEVELS) + 0.5) / LEVELS;
                ctx!.beginPath();
                for (let i = 0; i < rects.length; i += 4) ctx!.rect(rects[i], rects[i + 1], rects[i + 2], rects[i + 3]);
                ctx!.fill();
                rects.length = 0;
            }
            ctx!.globalAlpha = 1;
        }

        function drawTerrain(now: number, dark: boolean, art: Art) {
            const palette = art ? ART[art][dark ? "dark" : "light"] : null;
            // Color numbers for put(): the plain style has one ink, the art styles a few per kind
            const colors = palette
                ? [...palette.water, ...palette.land, ...palette.mark]
                : [dark ? "rgb(88,185,247)" : "rgb(13,17,23)"];
            const landAt = palette ? palette.water.length : 0;
            const markAt = palette ? landAt + palette.land.length : 0;

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
            const hovering = mouseX > -1e3;

            for (let r = 0; r < rows; r++) {
                const depth = r / (rows - 1);
                const rowFade = fade(rows - 1 - r, rows);
                const inv = 1 / (Z_FRONT + (Z_BACK - Z_FRONT) * depth);
                const base = r * cols;
                for (let c = 0; c < cols; c++) {
                    const k = base + c;
                    const x = W / 2 + (c / (cols - 1) - 0.5 + pan) * fx * inv;
                    if (x < -2 || x > W + 2) continue;
                    const land = lead.heights[k] > 0;
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
                    // Surrealist ground is draped like cloth
                    if (art === "surrealist") h += 22 * Math.sin(c * 0.15 + now * 0.0006) * Math.sin(r * 0.11 + 1);
                    const y = horizon + (camY - h * meter) * inv;
                    if (y < -4 || y > H + 4) continue;
                    const edge = rowFade * fade(Math.min(c, cols - 1 - c), cols);
                    if (!palette) {
                        put(0, edge * (land ? 0.28 + depth * 0.4 : 0.12 + depth * 0.2), x, y, 1.1, 1.1);
                    } else {
                        const pick = (k * 2654435761) >>> 8; // a stable pseudo-random number per dot
                        const color = land ? landAt + pick % palette.land.length : pick % palette.water.length;
                        if (art === "impressionist") {
                            // Dabs: flat strokes on water, squarer ones on land
                            if (land) put(color, edge * 0.85, x - 1.5, y - 1.5, 3, 3);
                            else put(color, edge * 0.85, x - 2.2, y - 0.9, 4.5, 1.8);
                        } else {
                            // Every fifth dot drips
                            const drip = pick % 5 ? 0 : 7 * Math.max(0, Math.sin(now * 0.001 + k * 0.37));
                            put(color, edge * 0.85, x, y, 1.3, 1.3 + drip);
                        }
                    }
                    if (hovering && Math.abs(x - mouseX) < HOVER_RADIUS) addGlow(x, y, k, now);
                }
            }

            // Landmarks rise out of the ground as their scene comes in, and sink as it leaves
            for (const s of live) {
                const grow = ease(s.weight);
                const { runs } = s;
                // Surrealist landmarks float a little off the ground
                const lift = art === "surrealist" ? (14 + 5 * Math.sin(now * 0.0008)) * grow : 0;
                for (let i = 0; i < runs.length; i += 4) {
                    const rf = runs[i] / 255;
                    const cf = runs[i + 1] / 255;
                    const inv = 1 / (Z_FRONT + (Z_BACK - Z_FRONT) * rf);
                    const x = W / 2 + (cf - 0.5 + pan) * fx * inv;
                    if (x < -2 || x > W + 2) continue;
                    const scale = METERS_PER_STEP * grow * meter * inv;
                    const top = Math.max(-4, horizon + camY * inv - runs[i + 3] * scale - lift);
                    const bottom = Math.min(H + 4, horizon + camY * inv - runs[i + 2] * scale - lift);
                    const color = palette ? markAt + (i >> 2) % palette.mark.length : 0;
                    const alpha = grow * fade((1 - rf) * (rows - 1), rows) * fade(Math.min(cf, 1 - cf) * (cols - 1), cols) *
                        (palette ? 1 : 0.55 + rf * 0.4);
                    const near = hovering && Math.abs(x - mouseX) < HOVER_RADIUS;
                    for (let y = top; y <= bottom; y += 2) {
                        if (art === "impressionist") {
                            put(color, alpha, x - 1.3, y, 2.6, 2.2);
                        } else if (art === "surrealist") {
                            // They melt: the sway grows with height
                            const up = bottom - y;
                            put(color, alpha, x + Math.sin(up * 0.035 + now * 0.0012) * (1.5 + up * 0.03), y, 1.2, 1.2);
                        } else {
                            put(color, alpha, x, y, 1.1, 1.1);
                        }
                        if (near) addGlow(x, y, i + y, now);
                    }
                }
            }
            flush(colors);

            ctx!.fillStyle = palette ? palette.light : dark ? "#fff" : "rgb(46,134,222)";
            const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
            for (const s of live) {
                const grow = ease(s.weight);
                const lift = art === "surrealist" ? (14 + 5 * Math.sin(now * 0.0008)) * grow : 0;
                for (let i = 0; i < s.beacons.length; i += 3) {
                    const inv = 1 / (Z_FRONT + (Z_BACK - Z_FRONT) * (s.beacons[i] / 255));
                    const x = W / 2 + (s.beacons[i + 1] / 255 - 0.5 + pan) * fx * inv;
                    const y = horizon + camY * inv - s.beacons[i + 2] * METERS_PER_STEP * grow * meter * inv - lift;
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

        // Impressionist: a low orange sun and its broken reflection on the water.
        // Surrealist: a soft clock sliding off the sky.
        function drawSky(now: number, dark: boolean, art: Art) {
            if (!art) return;
            const x = W * 0.74;
            const y = H * 0.2;
            ctx!.fillStyle = ctx!.strokeStyle = ART[art][dark ? "dark" : "light"].light;
            if (art === "impressionist") {
                for (const [radius, alpha] of [[26, 0.12], [18, 0.25], [12, 0.95]]) {
                    ctx!.globalAlpha = alpha;
                    ctx!.beginPath();
                    ctx!.arc(x, y, radius, 0, Math.PI * 2);
                    ctx!.fill();
                }
                for (let i = 0; i < 14; i++) {
                    const width = 34 - i * 1.8 + 6 * Math.sin(now * 0.002 + i * 1.7);
                    ctx!.globalAlpha = 0.55 - i * 0.03;
                    ctx!.fillRect(x - width / 2 + 5 * Math.sin(now * 0.0013 + i), H * 0.62 + i * 9, width, 2.4);
                }
            } else {
                const sag = 10 + 4 * Math.sin(now * 0.0009);
                ctx!.globalAlpha = 0.8;
                ctx!.lineWidth = 1.5;
                ctx!.beginPath();
                ctx!.moveTo(x - 30, y);
                ctx!.bezierCurveTo(x - 30, y - 26, x + 30, y - 26, x + 30, y);
                ctx!.bezierCurveTo(x + 30, y + 22, x + 14, y + 20, x + 10, y + 34 + sag);
                ctx!.bezierCurveTo(x + 6, y + 46 + sag, x - 4, y + 40 + sag, x - 6, y + 26);
                ctx!.bezierCurveTo(x - 12, y + 20, x - 30, y + 20, x - 30, y);
                ctx!.moveTo(x, y);
                ctx!.lineTo(x + 2, y - 15);
                ctx!.moveTo(x, y);
                ctx!.lineTo(x + 13, y + 5);
                ctx!.stroke();
            }
            ctx!.globalAlpha = 1;
        }

        function drawGlow(dark: boolean, art: Art) {
            ctx!.fillStyle = art ? ART[art][dark ? "dark" : "light"].light : dark ? "#fff" : "rgb(46,134,222)";
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
            const style = document.documentElement.dataset.art;
            const art = (style === "digital" ? undefined : style) as Art; // Classic and Digital share the plain dots
            if (scenes.length) {
                drawSky(now, dark, art);
                drawTerrain(now, dark, art);
                drawGlow(dark, art);
                ctx!.globalCompositeOperation = "destination-out";
                ctx!.drawImage(mask, 0, 0, W, H);
                ctx!.globalCompositeOperation = "source-over";
            }
            // The fog is tinted for the plain page's backgrounds only
            if (!art) for (const b of fogBlobs) drawFogBlob(b, now, dark);
        }

        // Only draw while on screen, so it doesn't compete with the map on phones
        let visible = true;
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
        observer.observe(canvas);

        function tick(now: number) {
            raf = requestAnimationFrame(tick);
            // A little slack so a 60 Hz screen lands on every second frame
            if (!visible || now - lastFrame < (busy ? FRAME_MS : IDLE_FRAME_MS) - 4) return;
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
            busy = moving || mouseX > -1e3;
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
                stale = true;
                go(0);
            })
            .catch(() => { /* fog only */ });

        resize();
        raf = requestAnimationFrame(tick);

        // Text can move after first paint, once the web fonts load
        document.fonts?.ready.then(buildMask);
        maskRef.current = buildMask;

        // The canvas ignores the pointer (it sits under the text), so listen on the panel
        const onMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };
        const onLeave = () => { mouseX = mouseY = -1e4; };
        panel?.addEventListener("mousemove", onMove);
        panel?.addEventListener("mouseleave", onLeave);

        window.addEventListener("resize", resize);
        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            observer.disconnect();
            window.removeEventListener("resize", resize);
            panel?.removeEventListener("mousemove", onMove);
            panel?.removeEventListener("mouseleave", onLeave);
            scenes = [];
        };
    }, []);

    // Each style has its own fonts, so the text moves when the style changes.
    // Rebuild the holes behind it now, and again once the new fonts have loaded.
    useEffect(() => {
        maskRef.current();
        const timers = [400, 1500].map((ms) => window.setTimeout(() => maskRef.current(), ms));
        return () => timers.forEach((t) => window.clearTimeout(t));
    }, [style]);

    const option = (label: React.ReactNode, on: boolean, pick: () => void, name?: string) => (
        <button
            key={name ?? String(label)}
            onClick={pick}
            aria-label={name}
            aria-pressed={on}
            className={on ? "underline underline-offset-4" : "opacity-50 hover:opacity-80"}
        >
            {label}
        </button>
    );

    return (
        <>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full pointer-events-none"
            />
            <div className="absolute top-5 left-10 md:left-16 z-20 text-xs tracking-wide text-chicago-flag-blue dark:text-slate-300">
                <button
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    className="opacity-60 hover:opacity-100"
                >
                    {open ? "close" : "view"}
                </button>
                {open && (
                    <div className="control-bar mt-2 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 rounded-lg p-3 backdrop-blur-sm">
                        {active >= 0 && (
                            <>
                                <span className="opacity-50">place</span>
                                <div className="flex gap-3">
                                    {PLACES.map(([name, short], i) => option(
                                        <>
                                            <span className="xl:hidden">{short}</span>
                                            <span className="hidden xl:inline">{name}</span>
                                        </>,
                                        i === active, () => pickRef.current(i), name,
                                    ))}
                                </div>
                            </>
                        )}
                        <span className="opacity-50">style</span>
                        <div className="flex gap-3">
                            {STYLE_NAMES.map(([id, name]) => option(name, id === style, () => onStyle(id)))}
                        </div>
                        <span className="opacity-50">light</span>
                        <div className="flex gap-3">
                            {option("Light", !isDarkMode, () => { if (isDarkMode) toggleDarkMode(); })}
                            {option("Dark", isDarkMode, () => { if (!isDarkMode) toggleDarkMode(); })}
                        </div>
                        {active >= 0 && (
                            <>
                                <span className="opacity-50">speed</span>
                                <div className="flex gap-3">
                                    {SPEEDS.map(([, label], i) => option(label, i === speed, () => setSpeed(i)))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
