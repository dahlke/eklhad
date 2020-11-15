import React, { Component } from "react";
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

	_toggleHistoricalLinks() {
		this.setState({
			showHistoricalLinks: !this.state.showHistoricalLinks,
		});
	}

	_showBlogViewer(blog) {
		console.log(blog);
		this.setState({
			showModal: true,
			shownBlog: blog,
		});
	}

	handleCloseModal() {
		this.setState({
			showModal: false,
			shownBlog: undefined,
		});
	}

	render() {
		const historicalLinkButtonText = this.state.showHistoricalLinks
			? "Hide Blogs"
			: "Show Blogs";

		// console.log(this.props.links);

		const blogLinks = this.props.blogs.map((blog) => {
			return (
				<div key={blog.id} className="link">
					<span className="metadata">
						[<span className="date">{blog.date}</span>] [
						<span className="type">Blog</span>]
					</span>
					<span className="url">
						<a href="#" onClick={() => this._showBlogViewer(blog)}>
							{blog.name}
						</a>
					</span>
				</div>
			);
		});

		return (
			<div className="links-list">
				<button onClick={this._toggleHistoricalLinks.bind(this)}>
					{historicalLinkButtonText}
				</button>
				{this.state.showHistoricalLinks ? blogLinks : null}
				<Modal
					isOpen={this.state.showModal}
					className="modal"
					contentLabel="Date Detail"
					shouldCloseOnOverlayClick={true}
					onRequestClose={this.handleCloseModal}
				>
					<div className="blog-content">
						<MarkdownView
							markdown={
								this.state.shownBlog
									? this.state.shownBlog.content
									: ""
							}
							options={{ tables: true, emoji: true }}
						/>
					</div>
					<button onClick={this.handleCloseModal}>Close Modal</button>
				</Modal>
			</div>
		);
	}
}

export default LinksList;
