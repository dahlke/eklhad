import React, { Component } from "react";
import PopulatedMap from "./container/PopulatedMap";
import PopulatedHeatmap from "./container/PopulatedHeatmap";
import md5 from "blueimp-md5";

import "./App.scss";
import PopulatedLinksList from "./container/PopulatedLinksList";

// TODO: make this a config item?
// Set the tablet breakpoint for responsive JS
const BREAKPOINT_TABLET = 768;

class App extends Component {
	state = {
		width: 0,
	};

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

	_updateWindowWidth() {
		this.setState({ width: window.innerWidth });
	}

	render() {
		const gravatarEmailMD5 = md5(this.props.gravatar.email);
		const gravatarURL = `https://www.gravatar.com/avatar/${gravatarEmailMD5}.jpg`;

		return (
			<div className="app">
				<div className="app-container">
					<div className="app-metadata">
						<img className="profile-picture" alt="" src={gravatarURL} />
						<h1>Neil Dahlke</h1>
						<h2>Engineer</h2>
						<h4>San Francisco, California, USA</h4>
						<h5>
							<a
								target="_blank"
								rel="noopener noreferrer"
								href="https://twitter.com/neildahlke"
							>
								Twitter
							</a>{" "}
							/{" "}
							<a
								target="_blank"
								rel="noopener noreferrer"
								href="https://www.instagram.com/eklhad"
							>
								Instagram
							</a>{" "}
							/{" "}
							<a
								target="_blank"
								rel="noopener noreferrer"
								href="https://www.github.com/dahlke"
							>
								GitHub
							</a>{" "}
							/{" "}
							<a
								target="_blank"
								rel="noopener noreferrer"
								href="https://www.linkedin.com/in/neildahlke"
							>
								LinkedIn
							</a>{" "}
							/ <a href="/static/resume.html">Resume</a>
						</h5>
					</div>
					<PopulatedMap
						locations={this.state.locations}
						currentLocation={this.state.currentLocation}
					/>
					<br />
					<br />
					<h3>Last 365 Days of Activity</h3>
					<PopulatedHeatmap
						width={this.state.width}
						horizontal={this.state.width > BREAKPOINT_TABLET}
					/>
					<h3>All Links</h3>
					<PopulatedLinksList />
				</div>
			</div>
		);
	}
}

export default App;
