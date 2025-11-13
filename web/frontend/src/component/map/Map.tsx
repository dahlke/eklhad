import React, { useState } from "react";
import MapGL, { Marker, Popup } from "react-map-gl/mapbox";
import type { ViewState } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

import { useLocations, type Location } from "../../contexts";

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibnRkIiwiYSI6ImNqdTM3eXplODBrYTQ0ZHBnNnB6bDcwbjMifQ.JhbZo-A0SGq4Pgk87T2hoQ";
const MAPBOX_STYLE = "mapbox://styles/ntd/cjsl0z4lm3d971fllo51zcza8";

function Map() {
	const { items: locations } = useLocations();
	// Initialize state
	const [viewState, setViewState] = useState<ViewState>({
		latitude: 37.7577,
		longitude: -122.4376,
		zoom: 6,
		bearing: 0,
		pitch: 50,
		padding: { top: 0, bottom: 0, left: 0, right: 0 },
	});
	const [popupInfo, setPopupInfo] = useState<Location | null>(null);

	const renderPopup = () => {
		return (
			popupInfo && (
				<Popup
					anchor="top"
					longitude={popupInfo.lng}
					latitude={popupInfo.lat}
					onClose={() => setPopupInfo(null)}
					closeButton={true}
					closeOnClick={false}
				>
					<b>
						{popupInfo.city}
						,
						{popupInfo.stateprovinceregion}
						{" "}
					</b>
					<br />
					<em>{popupInfo.country}</em>
				</Popup>
			)
		);
	};

	const renderLocationMarkers = () => {
		if (!locations || locations.length === 0) return null;

		return locations.map((location) => {
			let markerClassName = "map-custom-marker ";
			let markerIcon = null;

			if (location.current) {
				markerClassName += "current-location";
			} else if (!location.layover) {
				markerClassName += "static-location";
			}

			if (location.layover) {
				markerIcon = <span className="location-icon layover">✈</span>;
			}

			if (location.home) {
				markerIcon = <span className="location-icon home">★</span>;
			}

			return (
				<Marker
					key={location.id}
					latitude={location.lat}
					longitude={location.lng}
					anchor="bottom"
				>
					<div
						className={markerClassName}
						role="button"
						onClick={() => setPopupInfo(location)}
					>
						{markerIcon}
					</div>
				</Marker>
			);
		});
	};

	return (
		<div id="map">
			<MapGL
				{...viewState}
				onMove={(evt: { viewState: ViewState }) => setViewState(evt.viewState)}
				mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
				style={{ width: "100%", height: "100%" }}
				mapStyle={MAPBOX_STYLE}
				attributionControl={false}
			>
				{renderPopup()}
				{renderLocationMarkers()}
			</MapGL>
		</div>
	);
}

export default Map;