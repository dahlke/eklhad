import React, { Component } from "react";
import MapGL, { Marker, Popup } from "react-map-gl/mapbox";
import type { ViewState } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibnRkIiwiYSI6ImNqdTM3eXplODBrYTQ0ZHBnNnB6bDcwbjMifQ.JhbZo-A0SGq4Pgk87T2hoQ";
const MAPBOX_STYLE = "mapbox://styles/ntd/cjsl0z4lm3d971fllo51zcza8";

interface Location {
	id: string;
	lat: number;
	lng: number;
	current?: boolean;
	layover?: boolean;
	home?: boolean;
	city?: string;
	stateprovinceregion?: string;
	country?: string;
}

interface MapProps {
	locations?: Location[];
}

interface MapState {
	viewState: ViewState;
	popupInfo: Location | null;
}

class Map extends Component<MapProps, MapState> {
	constructor(props: MapProps) {
		super(props);
		this.state = {
			viewState: {
				latitude: 37.7577,
				longitude: -122.4376,
				zoom: 6,
				bearing: 0,
				pitch: 50,
				padding: { top: 0, bottom: 0, left: 0, right: 0 },
			},
			popupInfo: null,
		};
	}

	// Use default parameter instead of defaultProps
	get locations(): Location[] {
		return this.props.locations || [];
	}

	_renderPopup() {
		const { popupInfo } = this.state;

		return (
			popupInfo && (
				<Popup
					anchor="top"
					longitude={popupInfo.lng}
					latitude={popupInfo.lat}
					onClose={() => this.setState({ popupInfo: null })}
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
	}

	_renderLocationMarkers() {
		if (!this.locations || this.locations.length === 0) return null;

		return this.locations.map((location) => {
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
						onClick={() => this.setState({ popupInfo: location })}
					>
						{markerIcon}
					</div>
				</Marker>
			);
		});
	}

	render() {
		return (
			<div id="map">
				<MapGL
					{...this.state.viewState}
					onMove={(evt: { viewState: ViewState }) => this.setState({ viewState: evt.viewState })}
					mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
					style={{ width: "100%", height: "100%" }}
					mapStyle={MAPBOX_STYLE}
					attributionControl={false}
				>
					{this._renderPopup()}
					{this._renderLocationMarkers()}
				</MapGL>
			</div>
		);
	}
}

export default Map;