import React, { Component } from "react";
import "./LinksList.scss";

class LinksList extends Component {
	state = {
		showHistoricalLinks: false,
	};

	_toggleHistoricalLinks() {
		this.setState({
			showHistoricalLinks: !this.state.showHistoricalLinks,
		});
	}

	render() {
		const historicalLinkButtonText = this.state.showHistoricalLinks
			? "Hide Blogs"
			: "Show Blogs";

		const links = this.props.links.map((link) => {
			let component = link.type == "blog" ? (
				<div key={link.id} className="link">
					<span className="metadata">
						[<span className="date">{link.date}</span>] [
						<span className="type">{link.type}]</span>
					</span>
					<span className="url">
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							{link.name}
						</a>
					</span>
				</div>
			) : null;

			return component;
		});

		return (
			<div className="links-list">
				<button onClick={this._toggleHistoricalLinks.bind(this)}>
					{historicalLinkButtonText}
				</button>
				{this.state.showHistoricalLinks ? links : null}
			</div>
		);
	}
}

export default LinksList;
