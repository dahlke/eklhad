import React, { Component } from "react";
import PropTypes from 'prop-types';

// import "./LinksList.css";

class LinksList extends Component {
	constructor() {
		super();
		this.state = {
			showHistoricalLinks: false,
		};
	}

	_toggleHistoricalLinks() {
		this.setState((prevState) => ({ showHistoricalLinks: !prevState.showHistoricalLinks }));
	}

	render() {
		const historicalLinkButtonText = this.state.showHistoricalLinks
			? "Hide Blogs"
			: "Show Blogs";

		const blogLinks = this.props.blogs.map((blog) => (
			<div key={blog.id}>
				<span className="block text-xs mt-6">
					[
					{blog.date}
					] [
					Blog
					]
				</span>
				<a
					href={blog.url}
					target="_blank"
					rel="noopener noreferrer"
					className="underline"
				>
					{blog.name}
				</a>
			</div>
		));

		return (
			<div id="links-list">
				<button
					type="button"
					className="text-xs border border-solid border-indigo-500 hover:bg-gray-200 p-2 m-5 rounded"
					onClick={this._toggleHistoricalLinks.bind(this)}
				>
					{historicalLinkButtonText}
				</button>
				{this.state.showHistoricalLinks ? blogLinks : null}
			</div>
		);
	}
}

LinksList.propTypes = {
	blogs: PropTypes.array.isRequired,
};

export default LinksList;
