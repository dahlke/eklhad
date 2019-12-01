import React, { Component } from 'react';
import ReactMapGL, {Marker, Popup} from 'react-map-gl';
import './Map.scss';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibnRkIiwiYSI6ImNqdTM3eXplODBrYTQ0ZHBnNnB6bDcwbjMifQ.JhbZo-A0SGq4Pgk87T2hoQ"
const MAPBOX_STYLE = "mapbox://styles/ntd/cjsl0z4lm3d971fllo51zcza8"

class Map extends Component {

    state = {
        viewport: {
            width: "100%",
            height: 300,
            latitude: 37.7577,
            longitude: -122.4376,
            zoom: 6,
            bearing: 0,
            pitch: 50
        },
        popupInfo: null
    }

    _renderPopup() {
        const {popupInfo} = this.state;

        return popupInfo && (
            <Popup tipSize={5}
                anchor="top"
                offsetTop={10}
                offsetLeft={5}
                longitude={popupInfo.lng}
                latitude={popupInfo.lat}
                onClose={() => this.setState({popupInfo: null})} >
                <b>{popupInfo.city}, {popupInfo.stateprovinceregion} </b>
                <br />
                <em>{popupInfo.country}</em>
            </Popup>
        );
    }

    _renderMarkers() {
        var markers = [];

        if (this.props.locations) {
            markers = this.props.locations.map((location) => {
                var markerClassName = "map-custom-marker ";

                if (location.current !== true) {
                    markerClassName += "static-location"
                } else {
                    markerClassName += "current-location"
                }

                return (
                    <Marker
                        key={location.id}
                        latitude={location.lat}
                        longitude={location.lng}
                    >
                        <div className={markerClassName} onClick={() => this.setState({popupInfo: location})} />
                    </Marker>
                );
            });
        }

        return markers;
    }

    _renderCurrentLocation() {
        const {currentLocation} = this.props;
        var marker;

        if (currentLocation) {
            marker = (
                <Marker
                    key={currentLocation.properties.id}
                    latitude={currentLocation.lat}
                    longitude={currentLocation.lng}
                >
                    <div className="map-custom-marker current-location" onClick={() => this.setState({popupInfo: currentLocation})} />
                </Marker>
            );
        }

        return marker;
    }

    render() {
        return (
            <div id="map">
                <ReactMapGL
                    {...this.state.viewport}
                    onViewportChange={(viewport) => this.setState({viewport})}
                    mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
                    attributionControl={false}
                    worldCopyJump={true}
                    mapStyle={MAPBOX_STYLE}
                    width={"100%"}
                    >
                {this._renderPopup()}
                {this._renderMarkers()}
                {this._renderCurrentLocation()}
                </ReactMapGL>
            </div>
            );
        }
}

export default Map;
