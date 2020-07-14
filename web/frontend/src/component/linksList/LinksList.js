import React, { Component } from "react";
import "./LinksList.scss";

class LinksList extends Component {
	render() {
		const links = this.props.links.map((link) => {
			return (
				<div key={link.id} className="link">
					<span className="metadata">
						[<span className="date">{link.date}</span>] [
						<span className="type">{link.type}]</span>
					</span>
					<span className="url">
						<a href={link.url} target="_blank">
							{link.name}
						</a>
					</span>
				</div>
			);
		});

		return (
			<div className="links-list">
				{links}
			</div>
		);
	}
}

export default LinksList;
