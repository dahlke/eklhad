import React, { Component } from "react";
import PopulatedMap from "./container/PopulatedMap";
import PopulatedHeatmap from "./container/PopulatedHeatmap";
import Modal from "react-modal";
import MarkdownView from "react-showdown";
import md5 from "blueimp-md5";

import "./App.scss";
import PopulatedLinksList from "./container/PopulatedLinksList";

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

	_showBio() {
		this.setState({
			showModal: true
		});
	}

	handleCloseModal() {
		this.setState({
			showModal: false
		});
	}

	render() {
		const gravatarEmailMD5 = md5(
			this.props.gravatar ? this.props.gravatar.email : ""
		);
		const gravatarURL = `https://www.gravatar.com/avatar/${gravatarEmailMD5}.jpg`;

		return (
			<div className="app">
				<div id="modal"></div>
				<div className="app-container">
					<div className="app-metadata">
						<div className="sys-mes sys-mes-top">
							<span className="sys-mes-contents">
								&lt;SOM&gt;
							</span>
							<span className="sys-mes-description">
								Start of Message
							</span>
						</div>
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
					<PopulatedLinksList />

					<button onClick={this._showBio.bind(this)}>
						👋
					</button>
					<Modal
						isOpen={this.state.showModal}
						className="modal"
						contentLabel="Quick Hello Bio"
						shouldCloseOnOverlayClick={true}
						onRequestClose={this.handleCloseModal.bind(this)}
					>
						<div className="biography">
							<MarkdownView
								markdown={
									"Hey there, I’m Neil, a software engineer raised in Chicago, living in San Francisco. Thanks for visiting my page!"
								}
								options={{ tables: true, emoji: true }}
							/>
						</div>
						<button onClick={this.handleCloseModal.bind(this)}>Close Modal</button>
					</Modal>
					<div className="sys-mes sys-mes-bottom">
						<span className="sys-mes-contents">&lt;EOM&gt;</span>
						<span className="sys-mes-description">
							End of Message
						</span>
					</div>
				</div>
			</div>
		);
	}
}

export default App;
