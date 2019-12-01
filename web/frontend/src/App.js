import React, { Component } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
// import Select from 'react-select'
import Map from './map/Map.js';
import LinksList from './linksList/LinksList.js';
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
    linksDateMap: [],
    sortedLinks: [],
    selectedYear: parseInt(moment().subtract(1, 'years').format("YYYY")),
    selectedDate: null
  }

  constructor(props) {
    super(props);
    this._fetchLinkData();
    this._fetchLocationData();

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
      const linksList = document.getElementById("linksList")
      if (linksList) {
        linksList.scrollIntoView(false)
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
      .catch((err) => { console.log("Error retrieving locations.", err); })
      .then((data) => {
        data = !!data ? data : [];

        this.setState({
          locations: data
        });
      });
  }

  _fetchLinkData() {
    const api_url = `${API_BASE_URL}/links`;

    fetch(api_url)
      .then((response) => { return response.json() })
      .catch((err) => { console.log("Error retrieving links.", err); })
      .then((data) => {
        var linksDateMap = {};
        data = !!data ? data : [];

        data.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });

        data.forEach((link) => {
          if (!linksDateMap[link.date]) {
            linksDateMap[link.date] = [];
          }
          linksDateMap[link.date].push(link);
        });

        this.setState({
          sortedLinks: data,
          linksDateMap: linksDateMap
        });
      });
  }

  _selectDate(cell) {
    this.setState({
      selectedDate: cell ? cell.date : null
    });
  }

  /*
  _selectYear(event) {
    this.setState({
      selectedYear: event.value,
      selectedDate: null
    });
  }
  */

  render() {
    const links = this.state.selectedDate ? this.state.linksDateMap[this.state.selectedDate] : [];

    const years = links ? Array.from(new Set(Object.keys(this.state.linksDateMap).map((date) => {
      return parseInt(moment(date).format("YYYY"));
    }))) : [];

    const sortedYears = years.sort().reverse();

    /*
    const yearOptions = sortedYears.map((year) => {
      return {
        value: year,
        label: year
      };
    });
    */

    const heatmaps = sortedYears.map((year) => {
        const links = this.state.selectedDate ? this.state.linksDateMap[this.state.selectedDate] : [];
        const selectedYear = this.state.selectedDate ? parseInt(moment(this.state.selectedDate).format("YYYY")) : 1991;
        const linksList = year === selectedYear ? (<LinksList ref="links-list" links={links} />) : null;

        return (
          <div className="heatmap" key={`${year}-heatmap`}>
            <h4>{year}</h4>
            <CalendarHeatmap
              startDate={new Date(`${year}-01-01`)}
              endDate={new Date(`${year}-12-31`)}
              values={this.state.sortedLinks}
              onClick={this._selectDate.bind(this)}
              showMonthLabels={true}
              showWeekdayLabels={true}
              horizontal={this.state.width > BREAKPOINT_TABLET}
            />
            {linksList}
          </div>
        );
    });

    /*
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

            <Map locations={this.state.locations} currentLocation={this.state.currentLocation} />

            {heatmaps}
        </div>
      </div>
    );
  }
}

export default App;
