import React, { Component } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import Select from 'react-select'
import Map from './map/Map.js';
import LinksList from './linksList/LinksList.js';
import moment from 'moment';

import './App.scss';

// TODO: pass these in
const HOST = "localhost"
const PORT = "8080"
const API_BASE_URL = `http://${HOST}:${PORT}/api`;


class App extends Component {

  state = {
    viewport: {
      width: "100%",
      height: 300,
      latitude: 37.7577,
      longitude: -122.4376,
      zoom: 8
    },
    locations: {},
    linksDateMap: [],
    sortedLinks: [],
    selectedYear: parseInt(moment().subtract(1, 'years').format("YYYY")),
    selectedDate: null
  }

  constructor(props) {
    super(props);
    this._fetchLinkData();
    this._fetchLocationData();
  }

  _fetchLocationData() {
    const api_url = `${API_BASE_URL}/locations`; 

    fetch(api_url)
      .then((response) => { return response.json() })
      .catch((err) => { console.log("Error retrieving links."); })
      .then((data) => {
        this.setState({
          locations: data
        });
      });
  }

  _fetchLinkData() {
    const api_url = `${API_BASE_URL}/links`; 

    fetch(api_url)
      .then((response) => { return response.json() })
      .catch((err) => { console.log("Error retrieving links."); })
      .then((data) => {
        var linksDateMap = {};

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

  _selectYear(event) {
    this.setState({
      selectedYear: event.value,
      selectedDate: null
    });
  }
  render() {
    const links = this.state.selectedDate ? this.state.linksDateMap[this.state.selectedDate] : [];

    const years = links ? Array.from(new Set(Object.keys(this.state.linksDateMap).map((date) => { 
      return parseInt(moment(date).format("YYYY"));
    }))) : [];

    const yearOptions = years.sort().reverse().map((year) => {
      return {
        value: year,
        label: year
      };
    });

    console.log(this.state.selectedYear, yearOptions);

    return (
      <div className="app">
        <div className="container">
            <h1>Neil Dahlke</h1>
            <h3>Engineer, <a target="_blank" rel="noopener noreferrer" href="http://www.hashicorp.com/">HashiCorp</a></h3>
            <h5>(Formerly <a href="https://memsql.com">MemSQL</a>)</h5>
            <h6>San Francisco, California, USA</h6>
            <h6>
                <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/eklhad">Instagram</a> / <a target="_blank"  rel="noopener noreferrer" href="https://www.github.com/dahlke">GitHub</a> / <a target="_blank"  rel="noopener noreferrer" href="https://www.linkedin.com/in/neildahlke">LinkedIn</a> / <a href="static/resume.html">Resume</a>
            </h6>

            <Map locations={this.state.locations} />

            <div className="select-year">
              <Select 
                options={yearOptions} 
                value={{value: this.state.selectedYear, label: this.state.selectedYear}}
                onChange={this._selectYear.bind(this)}
                isSearchable={false}
              />
            </div>

            <CalendarHeatmap
              startDate={new Date(`${this.state.selectedYear}-01-01`)}
              endDate={new Date(`${this.state.selectedYear}-12-31`)}
              values={this.state.sortedLinks}
              onClick={this._selectDate.bind(this)}
              showMonthLabels={true}
              showWeekdayLabels={true}
            />
            <LinksList links={links} />
        </div>
      </div>
    );
  }
}

export default App;
