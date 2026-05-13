import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import MapGL, { Marker, type MapRef } from "react-map-gl/mapbox";
import type { ViewState } from "react-map-gl/mapbox";
import SunCalc from "suncalc";

import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

import { useLocations, type Location } from "../../contexts";
import tripRoutes from "../../config/tripRoutes.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySunlight(map: any) {
	const sunPos = SunCalc.getPosition(new Date(), 0, 0);
	const azimuthDeg = (sunPos.azimuth * 180 / Math.PI + 180 + 360) % 360;
	const polarDeg = Math.max(0, 90 - sunPos.altitude * 180 / Math.PI);
	const isDay = sunPos.altitude > -0.09;
	map.setLights([{
		id: "flat",
		type: "flat",
		properties: {
			anchor: "map",
			position: [1.5, azimuthDeg, polarDeg],
			color: isDay ? "white" : "#061830",
			intensity: isDay
				? Math.min(0.85, 0.25 + Math.sin(Math.max(0, sunPos.altitude)) * 0.75)
				: 0.04,
		},
	}]);
}

function greatCircleCoords(
	from: { lat: number; lng: number },
	to: { lat: number; lng: number },
	steps = 64
): [number, number][] {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const toDeg = (r: number) => (r * 180) / Math.PI;
	const φ1 = toRad(from.lat), λ1 = toRad(from.lng);
	const φ2 = toRad(to.lat), λ2 = toRad(to.lng);
	const Δ = Math.acos(Math.max(-1, Math.min(1,
		Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
	)));
	if (Δ < 1e-10) return [[from.lng, from.lat]];
	const coords: [number, number][] = [];
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const A = Math.sin((1 - t) * Δ) / Math.sin(Δ);
		const B = Math.sin(t * Δ) / Math.sin(Δ);
		const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
		const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
		const z = A * Math.sin(φ1) + B * Math.sin(φ2);
		let lng = toDeg(Math.atan2(y, x));
		const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
		// Keep longitude continuous so the arc doesn't wrap 360° around the globe
		if (coords.length > 0) {
			const prev = coords[coords.length - 1][0];
			while (lng - prev >  180) lng -= 360;
			while (prev - lng >  180) lng += 360;
		}
		coords.push([lng, lat]);
	}
	return coords;
}

type TripRoute = { from: string; to: string; mode: string };

const MODE_STYLE: Record<string, { color: string; width: number }> = {
	Plane: { color: "rgba(255, 255, 255, 0.45)", width: 0.8 },
	Train: { color: "rgba(255, 210, 60, 0.75)",  width: 1.2 },
	Car:   { color: "rgba(90,  210, 90,  0.55)", width: 0.8 },
	Ferry: { color: "rgba(60,  200, 255, 0.75)", width: 1.1 },
	Bus:   { color: "rgba(210, 120, 255, 0.65)", width: 0.9 },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addTravelArcs(map: any, locations: Location[]) {
	const cityLookup: Record<string, { lat: number; lng: number }> = {};
	for (const loc of locations) {
		if (loc.city) cityLookup[loc.city] = { lat: loc.lat, lng: loc.lng };
	}

	const byMode: Record<string, object[]> = {};
	for (const { from, to, mode } of tripRoutes as TripRoute[]) {
		const fa = cityLookup[from];
		const fb = cityLookup[to];
		if (!fa || !fb) continue;
		const key = mode in MODE_STYLE ? mode : "Plane";
		(byMode[key] ??= []).push({
			type: "Feature" as const,
			geometry: { type: "LineString" as const, coordinates: greatCircleCoords(fa, fb) },
			properties: {},
		});
	}

	const upsert = (sourceId: string, layerId: string, features: object[], paint: object) => {
		const geojson = { type: "FeatureCollection" as const, features: features as never[] };
		if (map.getSource(sourceId)) { map.getSource(sourceId).setData(geojson); return; }
		map.addSource(sourceId, { type: "geojson", data: geojson });
		map.addLayer({ id: layerId, type: "line", source: sourceId, paint });
	};

	for (const [mode, features] of Object.entries(byMode)) {
		const style = MODE_STYLE[mode] ?? MODE_STYLE.Plane;
		upsert(`arcs-${mode}`, `arcs-${mode}-layer`, features, {
			"line-color": style.color,
			"line-width": style.width,
			"line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.85, 8, 0],
		});
	}
}

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const MAPBOX_STYLE_SATELLITE = "mapbox://styles/mapbox/satellite-v9";

function Map() {
	const { items: locations } = useLocations();
const [viewState, setViewState] = useState<ViewState>({
		latitude: 37.7577,
		longitude: -122.4376,
		zoom: 11,
		bearing: 0,
		pitch: 45,
		padding: { top: 0, bottom: 0, left: 0, right: 0 },
	});
	const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
	const [mapLoaded, setMapLoaded] = useState(false);
	const mapRef = useRef<MapRef>(null);
	const locationsRef = useRef<Location[]>([]);

	useEffect(() => { locationsRef.current = locations ?? []; }, [locations]);

	const INITIAL_VIEW = { latitude: 37.7577, longitude: -122.4376, zoom: 11, bearing: 0, pitch: 45 };

	const handleReset = useCallback(() => {
		mapRef.current?.easeTo({ bearing: 0, pitch: 45, duration: 800 });
	}, []);

	const handleMapLoad = useCallback(() => {
		const map = mapRef.current?.getMap();
		if (!map) return;

		// Re-applied on every style load so dark/light mode switch doesn't reset it
		const applyGlobe = () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(map as any).setProjection("globe");
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(map as any).setFog({
				color: "rgb(186, 210, 235)",
				"high-color": "rgb(36, 92, 223)",
				"horizon-blend": 0.02,
				"space-color": "rgb(11, 11, 25)",
				"star-intensity": 0.6,
			});
			if (!map.getSource("mapbox-dem")) {
				map.addSource("mapbox-dem", {
					type: "raster-dem",
					url: "mapbox://mapbox.mapbox-terrain-dem-v1",
					tileSize: 512,
					maxzoom: 14,
				});
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(map as any).setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
			applySunlight(map);
			if (locationsRef.current.length) addTravelArcs(map, locationsRef.current);
		};
		applyGlobe();
		map.on("style.load", applyGlobe);
		setMapLoaded(true);

		// Zoom out over 60s while spinning simultaneously, driven through React state
		const ZOOM_START = 11;
		const ZOOM_END = 2.0;
		const PITCH_START = 45;
		const ZOOM_DURATION = 120000;
		let animFrame: number;
		let resumeTimer: ReturnType<typeof setTimeout>;

		const startSpin = (skipIntro = false) => {
			cancelAnimationFrame(animFrame);
			const spinStart = skipIntro ? null : Date.now();
			const spin = () => {
				setViewState(prev => {
					// Scale pan speed by zoom so visual velocity stays constant
					const lonDelta = 0.008 * Math.pow(2, ZOOM_END - prev.zoom);
					const longitude = prev.longitude + lonDelta;
					if (spinStart !== null) {
						const t = Math.min((Date.now() - spinStart) / ZOOM_DURATION, 1);
						const ease = t * t * (3 - 2 * t); // smoothstep
						const zoom = ZOOM_START + (ZOOM_END - ZOOM_START) * ease;
						const pitch = PITCH_START * (1 - ease);
						return { ...prev, zoom, longitude, pitch };
					}
					return { ...prev, longitude };
				});
				animFrame = requestAnimationFrame(spin);
			};
			animFrame = requestAnimationFrame(spin);
		};

		const stopSpin = () => {
			cancelAnimationFrame(animFrame);
			clearTimeout(resumeTimer);
		};

		const scheduleSpin = () => {
			clearTimeout(resumeTimer);
			resumeTimer = setTimeout(() => startSpin(true), 45000);
		};

		startSpin();
		map.on("mousedown", stopSpin);
		map.on("touchstart", stopSpin);
		map.on("mouseup", scheduleSpin);
		map.on("touchend", scheduleSpin);
		map.on("wheel", () => { stopSpin(); scheduleSpin(); });
	}, []);

	useEffect(() => {
		if (!lightboxUrl) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") setLightboxUrl(null);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [lightboxUrl]);

	// Keep sunlight in sync with real time
	useEffect(() => {
		if (!mapLoaded) return;
		const map = mapRef.current?.getMap();
		if (!map) return;
		const id = setInterval(() => applySunlight(map), 60000);
		return () => clearInterval(id);
	}, [mapLoaded]);

	// Add flight arcs once map + locations are both ready
	useEffect(() => {
		if (!mapLoaded || !locations?.length) return;
		const map = mapRef.current?.getMap();
		if (!map) return;
		addTravelArcs(map, locations);
	}, [mapLoaded, locations]);

	const locationMarkers = useMemo(() => {
		if (!locations || locations.length === 0) return null;

		return locations.map((loc) => {
			const location = loc;
			let markerClassName = "map-custom-marker";
			let markerIcon = null;
			const hasPhoto = !!location.photoemoji && !location.layover;

			if (location.current) {
				markerClassName += " current-location";
			} else if (!location.layover) {
				markerClassName += " static-location";
			}

			if (hasPhoto) markerClassName += " has-photo";

			if (location.layover) {
				markerClassName += " layover";
				markerIcon = <span className="photo-emoji-label layover">✈</span>;
			}

			const isNorthAmerica = location.country === "United States" || location.country === "Canada";
			const regionLabel = isNorthAmerica && location.stateprovinceregion
				? `, ${location.stateprovinceregion}`
				: location.country
				? `, ${location.country}`
				: location.stateprovinceregion
				? `, ${location.stateprovinceregion}`
				: "";

			const thumbUrl = location.photourl
					? location.photourl.replace("/photos/", "/photos/thumbs/")
					: "";

			return (
				<Marker
					key={location.id}
					latitude={location.lat}
					longitude={location.lng}
					anchor="bottom"
				>
					<div
						className="marker-wrapper"
						role="button"
						onClick={() => {
							if (location.photourl) setLightboxUrl(location.photourl);
						}}
					>
						<div className={markerClassName}>
							{hasPhoto
								? <span className="photo-emoji-label">{location.photoemoji}</span>
								: markerIcon
							}
						</div>
						{location.photourl ? (
							<div className="marker-photo-tooltip">
								<img src={thumbUrl} alt={location.city} className="tooltip-photo" loading="lazy" />
								<div className="tooltip-city-name">
									<span>{location.city}</span>
									<span className="tooltip-region-name">{regionLabel}</span>
								</div>
							</div>
						) : (
							<div className="marker-text-tooltip">
								<span className="tooltip-city">{location.city}</span>
								<span className="tooltip-region">{regionLabel}</span>
							</div>
						)}
					</div>
				</Marker>
			);
		});
	}, [locations]);

	return (
		<div id="map">
			<MapGL
				{...viewState}
				onMove={(evt: { viewState: ViewState }) => setViewState(evt.viewState)}
				mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
				ref={mapRef}
				onLoad={handleMapLoad}
				style={{ width: "100%", height: "100%" }}
				mapStyle={MAPBOX_STYLE_SATELLITE}
				attributionControl={false}
				cooperativeGestures={false}
			>
				{locationMarkers}
			</MapGL>

			<button className="map-reset-btn" onClick={handleReset} title="Reset orientation">↺</button>

			{lightboxUrl && createPortal(
				<div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
					<img
						src={lightboxUrl}
						alt="Location"
						className="lightbox-img"
						onClick={(e) => e.stopPropagation()}
					/>
					<button className="lightbox-close" onClick={() => setLightboxUrl(null)}>
						✕
					</button>
				</div>,
				document.body
			)}
		</div>
	);
}

export default Map;
