import React, { Component } from "react";
import PropTypes from 'prop-types';
import md5 from "blueimp-md5";

import PopulatedMap from "./container/PopulatedMap";
import PopulatedHeatmap from "./container/PopulatedHeatmap";
import PopulatedLinksList from "./container/PopulatedLinksList";

import "./App.scss";

// Set the tablet breakpoint for responsive JS
const BREAKPOINT_TABLET = 768;

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			width: 0,
		};
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
		const gravatarEmailMD5 = md5(
			this.props.gravatar ? this.props.gravatar.email : "",
		);
		const gravatarURL = `https://www.gravatar.com/avatar/${gravatarEmailMD5}.jpg`;

		return (
			<div id="app">
				<div id="modal" className="border-indigo-500 p-5" />
				<div className="container mx-auto text-center space-y-4 font-mono text-indigo-500 uppercase">
					<div className="block">
						<img
							className="m-auto mt-6 mb-6 rounded-full"
							alt="Neil Dahlke"
							src={gravatarURL}
						/>
						<h1 className="text-3xl p-1">Neil Dahlke</h1>
						<h2 className="text-2xl p-1">Engineer</h2>
						<h4 className="text-xl p-1">San Francisco, California, USA</h4>
						<h5 className="text-l p-1">
							<a
								className="underline"
								target="_blank"
								rel="noopener noreferrer"
								href="https://twitter.com/neildahlke"
							>
								Twitter
							</a>
							{" "}
							/
							{" "}
							<a
								className="underline"
								target="_blank"
								rel="noopener noreferrer"
								href="https://www.instagram.com/eklhad"
							>
								Instagram
							</a>
							{" "}
							/
							{" "}
							<a
								className="underline"
								target="_blank"
								rel="noopener noreferrer"
								href="https://www.github.com/dahlke"
							>
								GitHub
							</a>
							{" "}
							/
							{" "}
							<a
								className="underline"
								target="_blank"
								rel="noopener noreferrer"
								href="https://www.linkedin.com/in/neildahlke"
							>
								LinkedIn
							</a>
							{" "}
							/
							{' '}
							<a
								className="underline"
								href="/static/resume.html"
							>
								Resume
							</a>
						</h5>
					</div>
					<PopulatedMap />
					<h3>Last 365 Days of Activity</h3>
					<PopulatedHeatmap
						width={this.state.width}
						horizontal={this.state.width > BREAKPOINT_TABLET}
					/>
					<PopulatedLinksList />
				</div>
			</div>
		);
	}
}

App.propTypes = {
	gravatar: PropTypes.object.isRequired,
};

export default App;
