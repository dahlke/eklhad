import React, { Component } from "react";
import PropTypes from 'prop-types';
import Modal from "react-modal";
import MarkdownView from "react-showdown";
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

	handleCloseModal() {
		this.setState({
			showModal: false,
		});
	}

	_updateWindowWidth() {
		this.setState({ width: window.innerWidth });
	}

	_showBio() {
		this.setState({
			showModal: true,
		});
	}

	render() {
		const gravatarEmailMD5 = md5(
			this.props.gravatar ? this.props.gravatar.email : "",
		);
		const gravatarURL = `https://www.gravatar.com/avatar/${gravatarEmailMD5}.jpg`;

		return (
			<div className="app">
				<div id="modal" />
				<div className="app-container">
					<div className="app-metadata">
						<img
							className="profile-picture"
							alt=""
							src={gravatarURL}
						/>
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
							</a>
							{" "}
							/
							{" "}
							<a
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
								href="https://www.linkedin.com/in/neildahlke"
							>
								LinkedIn
							</a>
							{" "}
							/
							{' '}
							<a href="/static/resume.html">Resume</a>
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
					<PopulatedLinksList />

					<button type="button" onClick={this._showBio.bind(this)}>👋</button>
					<Modal
						isOpen={this.state.showModal}
						className="modal"
						contentLabel="Quick Hello Bio"
						shouldCloseOnOverlayClick
						onRequestClose={this.handleCloseModal}
					>
						<div className="biography">
							<MarkdownView
								markdown="Hey there, I’m Neil, a software engineer raised in Chicago, living in San Francisco. Thanks for visiting my page!"
								options={{ tables: true, emoji: true }}
							/>
						</div>
						<button type="button" onClick={this.handleCloseModal}>
							Close Modal
						</button>
					</Modal>
				</div>
			</div>
		);
	}
}

App.propTypes = {
	gravatar: PropTypes.object.isRequired,
};

export default App;
