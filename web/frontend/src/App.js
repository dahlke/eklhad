import React, { Component } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
// import Select from 'react-select'
import Map from './map/Map.js';
import DateDetailList from './dateDetailList/DateDetailList.js';
import moment from 'moment';
import './App.scss';


// To make it easier for local development with React, include the default port the API server will run on.
const PROTOCOL = window.location.protocol;
const DEFAULT_PORT = 80;
const PORT = PROTOCOL === "https:" ? 443 : (window.APP ? window.APP.apiPort : DEFAULT_PORT);
const HOST = window.APP ? window.APP.apiHost : window.location.hostname;
const API_BASE_URL = `${PROTOCOL}//${HOST}:${PORT}/api`;
const BREAKPOINT_TABLET = 768;

class App extends Component {

  state = {
    width: 0,
    locations: [],
    currentLocation: null,
    heatmapDateMap: [],
    sortedLinks: [],
    sortedInstagrams: [],
    selectedYear: parseInt(moment().subtract(1, 'years').format("YYYY")),
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
    const mapVals = this.state.sortedLinks.concat(this.state.sortedInstagrams);

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

    const heatmaps = sortedYears.map((year) => {
      return this._renderHeatMap(year);
    });

    /*
    const yearOptions = sortedYears.map((year) => {
      return {
        value: year,
        label: year
      };
    });

    <div className="select-year">
      <Select
        options={yearOptions}
        value={{value: this.state.selectedYear, label: this.state.selectedYear}}
        onChange={this._selectYear.bind(this)}
        isSearchable={false}
      />
    </div>
    */

    return (
      <div className="app">
        <div className="container">
            <h1>Neil Dahlke</h1>
            <h6>San Francisco, California, USA</h6>
            <h6>
              <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/neildahlke">Twitter</a> / <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/eklhad">Instagram</a> / <a target="_blank"  rel="noopener noreferrer" href="https://www.github.com/dahlke">GitHub</a> / <a target="_blank"  rel="noopener noreferrer" href="https://www.linkedin.com/in/neildahlke">LinkedIn</a> / <a href="/static/resume.html">Resume</a>
            </h6>

            <Map
              locations={this.state.locations}
              currentLocation={this.state.currentLocation}
              sortedInstagrams={this.state.instagrams}
            />
            {heatmaps}
        </div>
      </div>
    );
  }
}

export default App;
