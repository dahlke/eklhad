/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React, { Component } from "react";
import PropTypes from 'prop-types';
import ReactMapGL, { Marker, Popup } from "react-map-gl";

import "./Map.css";

// NOTE: I could remove this, but I have to get it into the JS somehow, so it will be
// exposed no matter what. All it does is associate the map to my account, so unless
// that becomes a problem, I'll just leave it.
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibnRkIiwiYSI6ImNqdTM3eXplODBrYTQ0ZHBnNnB6bDcwbjMifQ.JhbZo-A0SGq4Pgk87T2hoQ";
const MAPBOX_STYLE = "mapbox://styles/ntd/cjsl0z4lm3d971fllo51zcza8";

class Map extends Component {
	constructor() {
		super();
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

	_renderLocationMarkers() {
		let markers = [];

		if (this.props.locations) {
			markers = this.props.locations.map((location) => {
				let markerClassName = "map-custom-marker ";

				if (location.current !== true) {
					markerClassName += "static-location";
				} else {
					markerClassName += "current-location";
				}

				return (
					<Marker
						key={location.id}
						latitude={location.lat}
						longitude={location.lng}
					>
						<div
							className={markerClassName}
							role="button"
							onClick={() => this.setState({ popupInfo: location })}
						/>
					</Marker>
				);
			});
		}

		return markers;
	}

	render() {
					// width="100%"
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
					onViewportChange={(viewport) => this.setState({ viewport })}
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

Map.propTypes = {
	locations: PropTypes.array.isRequired,
};

export default Map;
