import React, { Component } from "react";
import PropTypes from 'prop-types';
import Modal from "react-modal";
import MarkdownView from "react-showdown";

import "./LinksList.scss";

class LinksList extends Component {
	constructor() {
		super();
		this.state = {
			showHistoricalLinks: false,
			showModal: false,
			shownBlog: undefined,
		};

		this.handleCloseModal = this.handleCloseModal.bind(this);
	}

	handleCloseModal() {
		this.setState({
			showModal: false,
			shownBlog: undefined,
		});
	}

	_showBlogViewer(blog) {
		this.setState({
			showModal: true,
			shownBlog: blog,
		});
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
				<button type="button" className="underline" onClick={() => this._showBlogViewer(blog)}>{blog.name}</button>
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
				<Modal
					className="absolute font-mono bg-gray-50 p-50 inset-1/10 overflow-scroll p-5 border-solid border-indigo-500"
					id="link-detail-modal"
					isOpen={this.state.showModal}
					contentLabel="Date Detail"
					shouldCloseOnOverlayClick={true}
					onRequestClose={this.handleCloseModal}
				>
					<MarkdownView
						markdown={
							this.state.shownBlog
								? this.state.shownBlog.content
								: ""
						}
						options={{ tables: true, emoji: true }}
					/>
					<button
						type="button"
						className="text-xs border border-solid border-indigo-500 hover:bg-gray-200 p-2 m-5 rounded"
						onClick={this.handleCloseModal}
					>
						Close Modal
					</button>
				</Modal>
			</div>
		);
	}
}

LinksList.propTypes = {
	blogs: PropTypes.array.isRequired,
};

export default LinksList;
