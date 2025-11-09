import React, { Component } from "react";
import ReactMapGL, { Marker, Popup, ViewportProps } from "react-map-gl";

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
	locations: Location[];
}

interface MapState {
	viewport: ViewportProps;
	popupInfo: Location | null;
}

class Map extends Component<MapProps, MapState> {
	constructor(props: MapProps) {
		super(props);
		this.state = {
			viewport: {
				width: "100%",
				height: 300,
				latitude: 37.7577,
				longitude: -122.4376,
				zoom: 6,
				bearing: 0,
				pitch: 50,
			},
			popupInfo: null,
		};
	}

	_renderPopup() {
		const { popupInfo } = this.state;

		return (
			popupInfo && (
				<Popup
					tipSize={5}
					anchor="top"
					offsetTop={10}
					offsetLeft={5}
					longitude={popupInfo.lng}
					latitude={popupInfo.lat}
					onClose={() => this.setState({ popupInfo: null })}
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

	static defaultProps: Partial<MapProps> = {
		locations: [],
	};

	_renderLocationMarkers() {
		if (!this.props.locations) return null;

		return this.props.locations.map((location) => {
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
				<ReactMapGL
					width={this.state.viewport.width}
					height={this.state.viewport.height}
					latitude={this.state.viewport.latitude}
					longitude={this.state.viewport.longitude}
					zoom={this.state.viewport.zoom}
					bearing={this.state.viewport.bearing}
					pitch={this.state.viewport.pitch}
					onViewportChange={(viewport: ViewportProps) => this.setState({ viewport })}
					mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
					attributionControl={false}
					worldCopyJump={true}
					mapStyle={MAPBOX_STYLE}
				>
					{this._renderPopup()}
					{this._renderLocationMarkers()}
				</ReactMapGL>
			</div>
		);
	}
}

export default Map;