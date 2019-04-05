import React, { Component } from 'react';
import ReactMapGL, {Marker} from 'react-map-gl';
import CustomMarker from './CustomMarker.js';
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
        locations: {}
    }
    
    _buildMarkers() {
        var markers = [];
        
        if (this.props.locations && this.props.locations.features) {
            markers = this.props.locations.features.map((feature) => {
                return (
                    <Marker 
                        key={feature.properties.id} 
                        latitude={feature.geometry.coordinates[1]} 
                        longitude={feature.geometry.coordinates[0]} 
                    >
                        <CustomMarker />
                    </Marker>
                    );
            });
        }
        
        return markers;
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
                {this._buildMarkers()}
                </ReactMapGL>
            </div>
            );
        }
}
        
export default Map;
        