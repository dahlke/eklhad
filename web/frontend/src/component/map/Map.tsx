import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import MapGL, { Marker, type MapRef } from "react-map-gl/mapbox";
import type { ViewState } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

import { useLocations, type Location } from "../../contexts";

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
	const mapRef = useRef<MapRef>(null);

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
		};
		applyGlobe();
		map.on("style.load", applyGlobe);

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
