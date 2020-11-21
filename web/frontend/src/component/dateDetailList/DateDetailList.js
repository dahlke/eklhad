import React, { Component } from "react";
import "./DateDetailList.scss";

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
				<div key={instagram.id} className="instagram">
					<div className="url">
						<a
							target="_blank"
							rel="noopener noreferrer"
							href={instagram.permalink}
						>
							<span className="metadata">
								[<span className="date">{instagram.date}</span>]
								[Instagram]
							</span>
							<img
								className="photo"
								src={instagram.media_url}
								alt={instagram.caption}
							/>
							<span className="caption">
								{instagram.caption === ""
									? "---"
									: instagram.caption}
							</span>
						</a>
					</div>
				</div>
			);
		});

		const tweets = this.props.data.tweets.map((tweet) => {
			return (
				<div key={tweet.id} className="tweet">
					<span className="metadata">
						[<span className="date">{tweet.date}</span>] [Tweet]
					</span>
					<span className="url">
						<a
							href={tweet.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							{tweet.text}
						</a>
					</span>
				</div>
			);
		});

		const githubActivity = this.props.data.githubActivity.map(
			(activity) => {
				return (
					<div
						key={activity.repo_name + activity.timestamp}
						className="github-activity"
					>
						<span className="metadata">
							[<span className="date">{activity.date}</span>]
							[GitHub Activity]
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
