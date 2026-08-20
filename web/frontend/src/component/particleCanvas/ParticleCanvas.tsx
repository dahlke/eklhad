import React, { useEffect, useRef } from "react";

/*
 * SF waveform — Unknown Pleasures lines, dense at top, softening into fog.
 * Fog blobs soften the content zone. Prefers-reduced-motion renders nothing.
 */

const LINE_COUNT = 34;

interface Bump {
    center: number;
    width: number;
    height: number;
    speed: number;
    breatheFreq: number;
    phase: number;
}

interface WaveLine {
    yFrac: number;
    alpha: number;
    hillAmp: number;
    hillFreq: number;
    bumps: Bump[];
}

interface FogBlob {
    x: number; y: number;
    rx: number; ry: number;
    alpha: number;
    driftSpeed: number;
    phase: number;
}

export function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        let W = 0;
        let H = 0;
        let raf = 0;
        let lines: WaveLine[] = [];
        let fogBlobs: FogBlob[] = [];

        // Cached per-alpha stroke colors and per-blob gradients — both are
        // identical every frame for a given (line/blob, dark) pairing, so
        // they're built once on first use instead of re-allocated every frame.
        const strokeCache = new Map<number, { light: string; dark: string }>();
        function getStrokeStyle(alpha: number, dark: boolean) {
            let entry = strokeCache.get(alpha);
            if (!entry) {
                entry = {
                    light: `rgba(13,17,23,${alpha})`,
                    dark: `rgba(88,185,247,${alpha})`,
                };
                strokeCache.set(alpha, entry);
            }
            return dark ? entry.dark : entry.light;
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

        function resize() {
            const parent = canvas!.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = rect.width;
            H = rect.height;
            canvas!.width = Math.round(W * dpr);
            canvas!.height = Math.round(H * dpr);
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function init() {
            resize();

            lines = Array.from({ length: LINE_COUNT }, (_, i) => {
                const t = i / (LINE_COUNT - 1);
                const yFrac = 0.03 + Math.pow(t, 2.0) * 0.92;
                const hillAmp = 4 + t * 10;
                const hillFreq = 0.003 + t * 0.002;
                const alpha = (0.13 + t * 0.18) * (1 - t * 0.45);
                return {
                    yFrac,
                    alpha,
                    hillAmp,
                    hillFreq,
                    bumps: Array.from(
                        { length: Math.round(4 - t * 2.5) },
                        () => ({
                            center: 0.15 + Math.random() * 0.7,
                            width: (60 + Math.pow(t, 1.5) * 260) * (0.7 + Math.random() * 0.6),
                            height: (5 + Math.random() * 14) * (0.3 + t * 0.9),
                            speed: (Math.random() - 0.5) * 0.000010,
                            breatheFreq: 0.00015 + Math.random() * 0.0003,
                            phase: Math.random() * Math.PI * 2,
                        })
                    ),
                };
            });

            // Kept to the left side, behind the name/links column — clear of the
            // horizon silhouette along the bottom edge.
            fogBlobs = [
                { x: 0.18, y: 0.40, rx: 260, ry: 110, alpha: 0.42, driftSpeed: 0.000008, phase: 0 },
                { x: 0.30, y: 0.58, rx: 300, ry: 120, alpha: 0.40, driftSpeed: 0.000006, phase: 2 },
                { x: 0.16, y: 0.75, rx: 240, ry: 100, alpha: 0.38, driftSpeed: 0.000009, phase: 4 },
                { x: 0.40, y: 0.50, rx: 210, ry:  95, alpha: 0.34, driftSpeed: 0.000007, phase: 1 },
            ];
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

        function draw(now: number) {
            ctx!.clearRect(0, 0, W, H);
            const dark = document.documentElement.classList.contains("dark");

            ctx!.lineWidth = 1;

            // Waveform lines
            for (const line of lines) {
                const baseY = line.yFrac * H;
                ctx!.strokeStyle = getStrokeStyle(line.alpha, dark);

                // A bump's drift position and breathing height don't depend
                // on x, so compute them once per bump here rather than once
                // per x-sample inside the loop below.
                const bumpCx: number[] = [];
                const bumpH: number[] = [];
                for (const b of line.bumps) {
                    const cx =
                        (((b.center + b.speed * now) % 1.2) + 1.2) % 1.2 - 0.1;
                    const breathe =
                        0.5 + 0.5 * Math.sin(now * b.breatheFreq + b.phase);
                    bumpCx.push(cx * W);
                    bumpH.push(b.height * (0.3 + 0.7 * breathe));
                }

                ctx!.beginPath();
                for (let x = 0; x <= W; x += 3) {
                    let y =
                        baseY +
                        Math.sin(x * line.hillFreq + line.yFrac * 20) * line.hillAmp;

                    for (let i = 0; i < line.bumps.length; i++) {
                        const b = line.bumps[i];
                        const dx = x - bumpCx[i];
                        y -= bumpH[i] * Math.exp(-(dx * dx) / (2 * b.width * b.width));
                    }

                    if (x === 0) ctx!.moveTo(x, y);
                    else ctx!.lineTo(x, y);
                }
                ctx!.stroke();
            }

            // Fog blobs over the lines
            for (const b of fogBlobs) drawFogBlob(b, now, dark);
        }

        function tick(now: number) {
            draw(now);
            raf = requestAnimationFrame(tick);
        }

        init();
        raf = requestAnimationFrame(tick);

        window.addEventListener("resize", resize);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none"
        />
    );
}
