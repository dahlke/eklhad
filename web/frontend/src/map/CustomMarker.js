import React, { Component } from 'react';

class CustomMarker extends Component {
    
    
    render() {
        const {size = 20, onClick} = this.props;
        
        return (
            <div className="map-custom-marker">
            </div>
        );
    }
}
    
export default CustomMarker;
