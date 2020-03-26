import React, { Component } from "react";
import Select from "react-select"
import PopulatedMap from "./container/PopulatedMap";
import PopulatedHeatmap from "./container/PopulatedHeatmap";
import moment from "moment";
import md5 from "blueimp-md5";

import "./App.scss";

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
    selectedYear: parseInt(moment().subtract(0, "years").format("YYYY")),
    selectedActivityType: ALL_ACTIVITIES_STRING,
    selectedDate: null
  }

  constructor(props) {
    super(props);
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

            <PopulatedHeatmap
              year={this.state.selectedYear}
              selectedDate={this.state.selectedDate}
              selectedActivityType={this.state.selectedActivityType}
              onClick={this._selectDate.bind(this)}
              horizontal={this.state.width > BREAKPOINT_TABLET}
            />
        </div>
      </div>
    );
  }
}

export default App;
