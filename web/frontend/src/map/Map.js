import React, { Component } from 'react';
import ReactMapGL, {Marker} from 'react-map-gl';
import './Map.scss';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibnRkIiwiYSI6ImhsTjRCZHcifQ.n0hx7Pe1GmCkQYYxBs0yjA"
const MAPBOX_STYLE = "mapbox://styles/ntd/cjsl0z4lm3d971fllo51zcza8"

class Map extends Component {
    
    state = {
        viewport: {
            width: "100%",
            height: 300,
            latitude: 37.7577,
            longitude: -122.4376,
            zoom: 8
        },
        locations: {},
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
                    offsetLeft={-20} 
                    offsetTop={-10} 
                />
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
                    zoomControl={false}
                    attributionControl={false}
                    zoom={2}
                    minZoom={2}
                    maxZoom={8}
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
        