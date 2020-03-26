import React, { Component } from "react";
import Select from "react-select"
import PopulatedMap from "./container/PopulatedMap";
import Heatmap from "./component/heatmap/Heatmap";
import moment from "moment";
import md5 from "blueimp-md5";

import "./App.scss";

// To make it easier for local development with React, include the default port the API server will run on.
const PROTOCOL = window.location.protocol;
const DEFAULT_PORT = 80;
const PORT = PROTOCOL === "https:" ? 443 : (window.APP ? window.APP.apiPort : DEFAULT_PORT);
const HOST = window.APP ? window.APP.apiHost : window.location.hostname;
const API_BASE_URL = `${PROTOCOL}//${HOST}:${PORT}/api`;

// Set the tablet breakpoint for responsive JS
const BREAKPOINT_TABLET = 768;

// TODO: all of this should come from server
const GRAVATAR_EMAIL = "neil.dahlke@gmail.com"
const ALL_ACTIVITIES_STRING = "All Activities";
const INSTAGRAMS_STRING = "Instagrams";
const LINKS_STRING = "Links";
const ACTIVITY_TYPES = [
  ALL_ACTIVITIES_STRING,
  INSTAGRAMS_STRING,
  LINKS_STRING
]

class App extends Component {

  state = {
    width: 0,
    // TODO: how to handle this with Redux? locations: [],
    currentLocation: null,
    heatmapDateMap: {},
    sortedLinks: [],
    sortedInstagrams: [],
    selectedYear: parseInt(moment().subtract(0, "years").format("YYYY")),
    selectedActivityType: ALL_ACTIVITIES_STRING,
    selectedDate: null
  }

  constructor(props) {
    super(props);
    this._fetchLinkData();
    this._fetchInstagramData();

    this._updateWindowWidth = this._updateWindowWidth.bind(this);
  }

  componentDidMount() {
    this._updateWindowWidth();
    window.addEventListener("resize", this._updateWindowWidth);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this._updateWindowWidth);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.selectedDate !== prevState.selectedDate && this.state.width <= BREAKPOINT_TABLET) {
      const dateDetailList = document.getElementById("DateDetailList")
      if (dateDetailList) {
        dateDetailList.scrollIntoView(false);
      }
    }
  }

  _updateWindowWidth() {
    this.setState({ width: window.innerWidth });
  }

  _fetchInstagramData() {
    const api_url = `${API_BASE_URL}/instagrams`;

    fetch(api_url)
      .then((response) => { return response.json() })
      .catch((err) => { console.error("Error retrieving instagrams.", err); })
      .then((data) => {
        var heatmapDateMap = this.state.heatmapDateMap;
        data = !!data ? data : [];

        // TODO: use the same keys across data stream type
        data.sort((a, b) => {
          return b.taken_at_timestamp - a.taken_at_timestamp;
        });

        data.forEach((link) => {
          const d = moment.unix(link.taken_at_timestamp).format("YYYY-MM-DD");
          link.date = d;
          if (!heatmapDateMap[d]) {
            heatmapDateMap[d] = {
              instagrams: [],
              links: []
            };
          }
          heatmapDateMap[d]["instagrams"].push(link);
        });

        this.setState({
          sortedInstagrams: data,
          heatmapDateMap: heatmapDateMap
        });
      });
  }

  _fetchLinkData() {
    const api_url = `${API_BASE_URL}/links`;

    fetch(api_url)
      .then((response) => { return response.json() })
      .catch((err) => { console.error("Error retrieving links.", err); })
      .then((data) => {
        var heatmapDateMap = this.state.heatmapDateMap;
        data = !!data ? data : [];

        data.sort((a, b) => {
          return b.timestamp - a.timestamp;
        });

        data.forEach((link) => {
          const d = moment.unix(link.timestamp).format("YYYY-MM-DD");
          link.date = d;
          if (!heatmapDateMap[d]) {
            heatmapDateMap[d] = {
              instagrams: [],
              links: []
            };
          }
          heatmapDateMap[d]["links"].push(link);
        });

        this.setState({
          sortedLinks: data,
          heatmapDateMap: heatmapDateMap
        });
      });
  }

  _selectDate(cell) {
    this.setState({
      selectedDate: cell ? cell.date : null
    });
  }

  _selectYear(event) {
    this.setState({
      selectedYear: event.value,
      selectedDate: null
    });
  }

  _selectActivity(event) {
    this.setState({
      selectedActivityType: event.value,
    });
  }

  render() {
    const years = Array.from(new Set(Object.keys(this.state.heatmapDateMap).map((date) => {
      return parseInt(moment(date).format("YYYY"));
    })));

    const sortedYears = years.sort().reverse();
    // sortedYears.push(ALL_YEARS_STRING)

    const yearOptions = sortedYears.map((year) => {
      return {
        value: year,
        label: year
      };
    });

    const activityOptions = ACTIVITY_TYPES.map((activity) => {
      return {
        value: activity,
        label: activity
      };
    });

    const gravatarEmailMD5 = md5(GRAVATAR_EMAIL);
    const gravatarURL = `https://www.gravatar.com/avatar/${gravatarEmailMD5}.jpg`

    return (
      <div className="app">
        <div className="container">
            <img className="profile-picture" alt="" src={gravatarURL} />
            <h1>Neil Dahlke</h1>
            <h2>Engineer (<span className="descriptor">Software</span>)</h2>
            <h4>
            San Francisco, California, USA <span className="descriptor">(Current)</span>
            </h4>
            <h6>
            Chicago, Illinois, USA <span className="descriptor">(Origin)</span>
            </h6>
            <h5>
              <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/neildahlke">Twitter</a> / <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/eklhad">Instagram</a> / <a target="_blank"  rel="noopener noreferrer" href="https://www.github.com/dahlke">GitHub</a> / <a target="_blank"  rel="noopener noreferrer" href="https://www.linkedin.com/in/neildahlke">LinkedIn</a> / <a href="/static/resume.html">Resume</a>
            </h5>
            <PopulatedMap
              locations={this.state.locations}
              currentLocation={this.state.currentLocation}
            />
            <br />
            <br />
            <h3>Activity</h3>

            <div className="select">
              <Select
                options={yearOptions}
                value={{value: this.state.selectedYear, label: this.state.selectedYear}}
                onChange={this._selectYear.bind(this)}
                isSearchable={false}
              />
            </div>
            <div className="select wide">
              <Select
                options={activityOptions}
                value={{value: this.state.selectedActivityType, label: this.state.selectedActivityType}}
                onChange={this._selectActivity.bind(this)}
                isSearchable={false}
              />
            </div>

            <Heatmap
              year={this.state.selectedYear}
              selectedDate={this.state.selectedDate}
              selectedActivityType={this.state.selectedActivityType}
              heatmapDateMap={this.state.heatmapDateMap}
              sortedInstagrams={this.state.sortedInstagrams}
              sortedLinks={this.state.sortedLinks}
              onClick={this._selectDate.bind(this)}
              horizontal={this.state.width > BREAKPOINT_TABLET}
            />
        </div>
      </div>
    );
  }
}

export default App;
