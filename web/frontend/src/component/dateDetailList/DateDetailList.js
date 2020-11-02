import React, { Component } from "react";
import "./DateDetailList.scss";

const MAX_TWEET_DISPLAY_LENGTH = 60;

class DateDetailList extends Component {
	render() {
		const links = this.props.data.links.map((link) => {
			return (
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
			);
		});

		const instagrams = this.props.data.instagrams.map((instagram) => {
			return (
				<div key={instagram.shortcode} className="instagram">
					<div className="url">
						<a
							target="_blank"
							rel="noopener noreferrer"
							href={instagram.url}
						>
							<span className="metadata">
								[<span className="date">{instagram.date}</span>]  [Instagram]
								[
								<span className="type">
									{instagram.location === ""
										? "Unknown"
										: instagram.location}
									]
								</span>
							</span>
							<img
								className="photo"
								src={instagram.url}
								alt={instagram.location}
							/>
						</a>
					</div>
				</div>
			);
		});

		const tweets = this.props.data.tweets.map(
			(tweet) => {
				console.log(tweet);
				return (
					<div
						key={tweet.id}
						className="tweet"
					>
						<span className="metadata">
							[<span className="date">{tweet.date}</span>] [Tweet]
						</span>
						<span className="url">
							<a
								href={
									tweet.url
								}
								target="_blank"
								rel="noopener noreferrer"
							>
								{tweet.text}
							</a>
						</span>
					</div>
				);
			}
		);

		const githubActivity = this.props.data.githubActivity.map(
			(activity) => {
				return (
					<div
						key={activity.repo_name + activity.timestamp}
						className="github-activity"
					>
						<span className="metadata">
							[<span className="date">{activity.date}</span>] [GitHub Activity]
						</span>
						<span className="url">
							<a
								href={
									"https://github.com/" + activity.repo_name
								}
								target="_blank"
								rel="noopener noreferrer"
							>
								{activity.repo_name} ({activity.num_commits}{" "}
								commits)
							</a>
						</span>
					</div>
				);
			}
		);

		return (
			<div className="date-detail-list">
				{instagrams}
				{tweets}
				{links}
				{githubActivity}
			</div>
		);
	}
}

export default DateDetailList;
