import React, { Component } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import Select from 'react-select'
import Map from './component/map/Map.js';
import DateDetailList from './component/dateDetailList/DateDetailList.js';
import moment from 'moment';
import './App.scss';


// To make it easier for local development with React, include the default port the API server will run on.
const PROTOCOL = window.location.protocol;
const DEFAULT_PORT = 80;
const PORT = PROTOCOL === "https:" ? 443 : (window.APP ? window.APP.apiPort : DEFAULT_PORT);
const HOST = window.APP ? window.APP.apiHost : window.location.hostname;
const API_BASE_URL = `${PROTOCOL}//${HOST}:${PORT}/api`;
const BREAKPOINT_TABLET = 768;
const ALL_YEARS_STRING = "All Years";

const ALL_ACTIVITIES_STRING = "All Activities";
const INSTAGRAMS_STRING = "Instagrams";
const LINKS_STRING = "Links";

// TODO
// const LOCATIONS_STRING = "Locations";
const ACTIVITY_TYPES = [
  ALL_ACTIVITIES_STRING,
  INSTAGRAMS_STRING,
  LINKS_STRING
]

class App extends Component {

  state = {
    width: 0,
    locations: [],
    currentLocation: null,
    heatmapDateMap: [],
    sortedLinks: [],
    sortedInstagrams: [],
    selectedYear: parseInt(moment().subtract(0, 'years').format("YYYY")),
    selectedActivityType: ALL_ACTIVITIES_STRING,
    selectedDate: null
  }

  constructor(props) {
    super(props);
    this._fetchLinkData();
    this._fetchLocationData();
    this._fetchInstagramData();

    this._updateWindowWidth = this._updateWindowWidth.bind(this);
  }

  componentDidMount() {
    this._updateWindowWidth();
    window.addEventListener('resize', this._updateWindowWidth);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._updateWindowWidth);
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

  _fetchLocationData() {
    const api_url = `${API_BASE_URL}/locations`;

    fetch(api_url)
      .then((response) => { return response.json() })
      .catch((err) => { console.error("Error retrieving locations.", err); })
      .then((data) => {
        data = !!data ? data : [];

        this.setState({
          locations: data
        });
      });
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

  _renderHeatMap(year) {
    // TODO: either make use of the selector or get rid of all the code referencing it.
    const dataForDate = this.state.selectedDate ? this.state.heatmapDateMap[this.state.selectedDate] : [];
    const dateDetailList = this.state.selectedDate ? (
      <DateDetailList
        ref="date-detail-list"
        data={dataForDate}
      />
    ) : null;
    const isSelectedDateMap = parseInt(moment(this.state.selectedDate).format("YYYY")) === year;

    var mapVals = [];
    if (this.state.selectedActivityType === ALL_ACTIVITIES_STRING) {
      mapVals = this.state.sortedLinks.concat(this.state.sortedInstagrams);
      console.log("mapVals", mapVals)
    } else if (this.state.selectedActivityType === INSTAGRAMS_STRING) {
      mapVals = this.state.sortedInstagrams;
    } else if (this.state.selectedActivityType === LINKS_STRING) {
      mapVals = this.state.sortedLinks;
    }

    return (
      <div className="heatmap" key={`${year}-heatmap`}>
        <h4>{year}</h4>
        <CalendarHeatmap
          startDate={new Date(`${year}-01-01`)}
          endDate={new Date(`${year}-12-31`)}
          values={mapVals}
          onClick={this._selectDate.bind(this)}
          showMonthLabels={true}
          showWeekdayLabels={true}
          horizontal={this.state.width > BREAKPOINT_TABLET}
        />
        {isSelectedDateMap ? dateDetailList : undefined}
      </div>
    );
  }

  render() {
    const years = Array.from(new Set(Object.keys(this.state.heatmapDateMap).map((date) => {
      return parseInt(moment(date).format("YYYY"));
    })));

    const sortedYears = years.sort().reverse();
    // sortedYears.push(ALL_YEARS_STRING)

    const heatmaps = [];

    sortedYears.forEach((year) => {
      if (year == this.state.selectedYear) {
        heatmaps.push(this._renderHeatMap(year))
      }
    });

    // TODO: add the option for all years
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

    console.log(yearOptions);
    console.log(activityOptions);

    return (
      <div className="app">
        <div className="container">
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
            <Map
              locations={this.state.locations}
              currentLocation={this.state.currentLocation}
              sortedInstagrams={this.state.instagrams}
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

            {heatmaps}
        </div>
      </div>
    );
  }
}

export default App;
