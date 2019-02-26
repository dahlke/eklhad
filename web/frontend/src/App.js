import React, { Component } from 'react';
import ReactMapGL, {Marker} from 'react-map-gl';

import './App.scss';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibnRkIiwiYSI6ImhsTjRCZHcifQ.n0hx7Pe1GmCkQYYxBs0yjA"
const MAPBOX_STYLE = "mapbox://styles/ntd/cjsl0z4lm3d971fllo51zcza8"

// TODO: pass these in
const HOST = "localhost"
const PORT = "8080"
const API_BASE_URL = `http://${HOST}:${PORT}/api`;


class App extends Component {

  state = {
    viewport: {
      width: 600,
      height: 300,
      latitude: 37.7577,
      longitude: -122.4376,
      zoom: 8
    },
    locations: {},
    links: []
  }

  constructor(props) {
    super(props);
    this._fetchLinkData();
    this._fetchLocationData();
  }

  _fetchLocationData() {
    const api_url = `${API_BASE_URL}/locations`; 

    fetch(api_url)
      .then((response) => {
        return response.json()
      })
      .catch((err) => {
        console.log("Error retrieving links.");
      })
      .then((data) => {
        const newState = {}
        newState["locations"] = data;
        this.setState(newState);
      });
  }

  _fetchLinkData() {
    const api_url = `${API_BASE_URL}/links`; 

    fetch(api_url)
      .then((response) => {
        return response.json()
      })
      .catch((err) => {
        console.log("Error retrieving links.");
      })
      .then((data) => {
        const newState = {}
        // Sort the links with latest desc
        data.sort(function(a, b){
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            return bDate - aDate;
        })
        newState["links"] = data;
        this.setState(newState);
      });
  }

  _buildMarkers() {
    const markers = [];
    if (this.state.locations.features != null) {
      for (var i in this.state.locations.features) {
        const feature = this.state.locations.features[i];
        markers.push(
          <Marker 
            key={feature.properties.id} 
            latitude={feature.geometry.coordinates[1]} 
            longitude={feature.geometry.coordinates[0]} 
            offsetLeft={-20} 
            offsetTop={-10} 
          >
          </Marker>
        )
      }
      return markers;
    }
  }

  _buildLinks() {
    const links = [];
    if (this.state.links.length !== 0) {
      for (var i in this.state.links) {
        const link = this.state.links[i];
        links.push(
          <div class="link" >
              <span class="date">[{link.date}] [{link.type}]</span>
              <span class="url"><a href={link.url}>{link.name}</a></span>
          </div>
        )
      }
    }
    return links;
  }

  render() {
    const markers = this._buildMarkers();
    const links = this._buildLinks();

    return (
      <div className="App">
        <div className="container">
            <h1>Neil Dahlke</h1>
            <h3>Engineer, <a target="_blank" rel="noopener noreferrer" href="http://www.hashicorp.com/">HashiCorp</a></h3>
            <h5>(Formerly <a href="https://memsql.com">MemSQL</a>)</h5>
            <h6>San Francisco, California, USA</h6>
            <h6>
                <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/eklhad">Instagram</a> / <a target="_blank"  rel="noopener noreferrer" href="https://www.github.com/dahlke">GitHub</a> / <a target="_blank"  rel="noopener noreferrer" href="https://www.linkedin.com/in/neildahlke">LinkedIn</a> / <a href="static/resume.html">Resume</a>
            </h6>
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
              >
                {markers}
              </ReactMapGL>

              <div class="links">
                <h5>Activity</h5>
                {links}
              </div>
            </div>
        </div>
      </div>
    );
  }
}

export default App;
