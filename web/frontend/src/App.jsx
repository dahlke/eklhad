import React, { Component } from "react";
import PropTypes from 'prop-types';
import md5 from "blueimp-md5";

import PopulatedMap from "./container/PopulatedMap";
// import PopulatedLinksList from "./container/PopulatedLinksList";

import "./App.css";

// Set the tablet breakpoint for responsive JS
// const BREAKPOINT_TABLET = 768;

class App extends Component {

	render() {
		const gravatarEmailMD5 = md5(
			this.props.gravatar ? this.props.gravatar.email : "",
		);
		const gravatarURL = `https://www.gravatar.com/avatar/${gravatarEmailMD5}.jpg`;

		/*
			<PopulatedLinksList />
		*/

		return (
			<div id="app" className="container mx-auto p-4 text-chicago-flag-blue">
				<div className="text-center font-mono w-full md:w-1/2 mx-auto uppercase">
					<div className="block">
						<img
							className="w-24 h-24 mx-auto rounded-full"
							alt="Neil Dahlke"
							src={gravatarURL}
						/>
						<h1 className="pt-5 pb-2 text-3xl font-bold">Neil Dahlke</h1>
						<h2 className="pb-2">Software Solutions Engineer</h2>
						<h4 className="pb-2">San Francisco, California, USA</h4>
						<h5 className="pb-10">
							<a
								target="_blank"
								className="underline"
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
								className="underline"
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
								className="underline"
								rel="noopener noreferrer"
								href="https://x.com/neildahlke"
							>
								X
							</a>
							{" "}
							/
							{" "}
							<a
								target="_blank"
								className="underline"
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
								className="underline"
								rel="noopener noreferrer"
								href="https://www.linkedin.com/in/neildahlke"
							>
								LinkedIn
							</a>
							{" "}
							/
							{" "}
							<a
								target="_blank"
								className="underline"
								rel="noopener noreferrer"
								href="https://www.strava.com/athletes/4351145"
							>
								Strava
							</a>
							{" "}
							/
							{' '}
							<a
								href="/static/resume.html"
								className="underline"
							>
								Résumé
							</a>
						</h5>
					</div>
					<PopulatedMap />
				</div>
			</div>
		);
	}
}

App.defaultProps = {
  gravatar: {},
};

App.propTypes = {
	gravatar: PropTypes.object,
};

export default App;
