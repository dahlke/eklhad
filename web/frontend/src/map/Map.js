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
        locations: {},
        popupInfo: null
    }

    _renderPopup() {
        const {popupInfo} = this.state;

        console.log(popupInfo);
        return popupInfo && (
            <Popup tipSize={5}
                anchor="top"
                offsetTop={10}
                offsetLeft={5}
                longitude={popupInfo.geometry.coordinates[0]}
                latitude={popupInfo.geometry.coordinates[1]}
                onClose={() => this.setState({popupInfo: null})} >
                {popupInfo.properties.name}
            </Popup>
        );
    }
    
    _renderMarkers() {
        var markers = [];
        
        if (this.props.locations && this.props.locations.features) {
            markers = this.props.locations.features.map((feature) => {
                return (
                    <Marker 
                        key={feature.properties.id} 
                        latitude={feature.geometry.coordinates[1]} 
                        longitude={feature.geometry.coordinates[0]} 
                    >
                        <div className="map-custom-marker" onClick={() => this.setState({popupInfo: feature})} />
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
                {this._renderPopup()}
                {this._renderMarkers()}
                </ReactMapGL>
            </div>
            );
        }
}
        
export default Map;
        