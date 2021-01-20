import React, { Component } from "react";
import PropTypes from 'prop-types';

class DateDetailList extends Component {
	render() {
		const links = this.props.data.links.map((link) => (
			<div key={link.id}>
				<span className="block text-xs mt-6">
					[
					{link.date}
					]
					[
					{link.type}
					]
				</span>
				<span className="underline">
					<a
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
					>
						{link.name}
					</a>
				</span>
			</div>
		));

		const instagrams = this.props.data.instagrams.map((instagram) => (
			<div key={instagram.id}>
				<a
					target="_blank"
					rel="noopener noreferrer"
					href={instagram.permalink}
				>
					<span className="block m-auto center">
						[
						<span className="">{instagram.date}</span>
						]
						[Instagram]
					</span>
					<img
						className="m-auto w-2/4"
						src={instagram.media_url}
						alt={instagram.caption}
					/>
					<span className="underline">
						{instagram.caption === ""
							? "---"
							: instagram.caption}
					</span>
				</a>
			</div>
		));

		const tweets = this.props.data.tweets.map((tweet) => (
			<div key={tweet.id}>
				<span className="block text-xs mt-6">
					[
					{tweet.date}
					] [Tweet]
				</span>
				<a
					href={tweet.url}
					target="_blank"
					className="block underline"
					rel="noopener noreferrer"
				>
					{tweet.text}
				</a>
			</div>
		));

		const githubActivity = this.props.data.githubActivity.map((activity) => (
			<div
				key={activity.repo_name + activity.timestamp}
				className="m-5"
			>
				<span className="block text-xs">
					[
					{activity.date}
					] [GitHub Activity]
				</span>
				<a
					href={
						`https://github.com/${activity.repo_name}`
					}
					className="block underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					{activity.repo_name}
					{" "}
					(
					{activity.num_commits}
					{" "}
					commits)
				</a>
			</div>
		));

		return (
			<div id="date-detail-list">
				{instagrams}
				{tweets}
				{links}
				{githubActivity}
			</div>
		);
	}
}

DateDetailList.propTypes = {
	data: PropTypes.object.isRequired,
};

export default DateDetailList;
