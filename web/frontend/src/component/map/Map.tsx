import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import MapGL, { Marker, type MapRef } from "react-map-gl/mapbox";
import type { ViewState } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

import { useLocations, useDarkMode, type Location } from "../../contexts";
import locationPhotos from "../../config/locationPhotos.json";

type PhotoEntry = { url: string; emoji: string; date: string | null; slug: string };
const photoMap = locationPhotos as Record<string, PhotoEntry>;

function withPhoto(location: Location): Location {
	if (location.photourl) return location;
	const entry = photoMap[location.city ?? ""];
	if (!entry) return location;
	return {
		...location,
		photourl:   entry.url,
		photoemoji: entry.emoji,
		photodate:  entry.date ?? undefined,
	};
}

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const MAPBOX_STYLE_LIGHT = "mapbox://styles/mapbox/light-v11";
const MAPBOX_STYLE_DARK = "mapbox://styles/mapbox/dark-v11";

function Map() {
	const { items: locations } = useLocations();
	const { isDarkMode } = useDarkMode();
	const [viewState, setViewState] = useState<ViewState>({
		latitude: 37.7577,
		longitude: -122.4376,
		zoom: 6,
		bearing: 0,
		pitch: 0,
		padding: { top: 0, bottom: 0, left: 0, right: 0 },
	});
	const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
	const mapRef = useRef<MapRef>(null);

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
		};
		applyGlobe();
		map.on("style.load", applyGlobe);

		// Auto-rotation: slow spin that pauses while user interacts, resumes 2s after release
		let animFrame: number;
		let resumeTimer: ReturnType<typeof setTimeout>;

		const startSpin = () => {
			cancelAnimationFrame(animFrame);
			const spin = () => {
				map.setBearing((map.getBearing() + 0.05) % 360);
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
			resumeTimer = setTimeout(startSpin, 2000);
		};

		startSpin();
		map.on("mousedown", stopSpin);
		map.on("touchstart", stopSpin);
		map.on("mouseup", scheduleSpin);
		map.on("touchend", scheduleSpin);
		map.on("wheel", scheduleSpin);
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
			const location = withPhoto(loc);
			let markerClassName = "map-custom-marker";
			let markerIcon = null;
			const hasPhoto = !!location.photoemoji && !location.layover && !location.home && !location.current;

			if (location.current) {
				markerClassName += " current-location";
			} else if (!location.layover) {
				markerClassName += " static-location";
			}

			if (hasPhoto) markerClassName += " has-photo";

			if (location.current) {
				markerIcon = <span className="location-icon current">🌉</span>;
			}
			if (location.layover) {
				markerIcon = <span className="location-icon layover">✈</span>;
			}
			if (location.home) {
				markerIcon = <span className="location-icon home">🏠</span>;
			}

			const isNorthAmerica = location.country === "United States" || location.country === "Canada";
			const regionLabel = isNorthAmerica && location.stateprovinceregion
				? `, ${location.stateprovinceregion}`
				: location.country
				? `, ${location.country}`
				: location.stateprovinceregion
				? `, ${location.stateprovinceregion}`
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
						{hasPhoto && (
							<span className="photo-emoji-label">{location.photoemoji}</span>
						)}
						<div className={markerClassName}>
							{markerIcon}
						</div>
						{location.photourl ? (
							<div className="marker-photo-tooltip">
								<img src={location.photourl} alt={location.city} className="tooltip-photo" />
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
				mapStyle={isDarkMode ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT}
				attributionControl={false}
				cooperativeGestures={true}
			>
				{locationMarkers}
			</MapGL>

			{lightboxUrl && (
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
				</div>
			)}
		</div>
	);
}

export default Map;
