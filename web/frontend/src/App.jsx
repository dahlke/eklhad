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
			<div id="app" className="container mx-auto p-4 text-chicago-flag-blue">
				<div id="modal" className="border-chicago-flag-blue p-5" />
				<div className="text-center font-mono w-full md:w-1/2 mx-auto uppercase">
					<div className="block">
						<img
							className="w-24 h-24 mx-auto rounded-full"
							alt="Neil Dahlke"
							src={gravatarURL}
						/>
						<h1 className="pt-5 pb-2">Neil Dahlke</h1>
						<h2 className="pb-2">Engineer</h2>
						<h4 className="pb-2">San Francisco, California, USA</h4>
						<h5 className="pb-10">
							<a
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
								target="_blank"
								rel="noopener noreferrer"
								href="https://instagram.com/eklhad"
							>
								Instagram
							</a>
							{" "}
							/
							{" "}
							<a
								target="_blank"
								rel="noopener noreferrer"
								href="https://eklhad.medium.com/"
							>
								Medium
							</a>
							{" "}
							/
							{" "}
							<a
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
								href="/static/resume.html"
							>
								Resume
							</a>
						</h5>
					</div>
					<PopulatedMap />
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
