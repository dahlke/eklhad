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
						<a href={link.url} target="_blank">
							{link.name}
						</a>
					</span>
				</div>
			);
		});

		const instagrams = this.props.data.instagrams.map((instagram) => {
			return (
				<div
					key={instagram.shortcode}
					className="instagram"
				>
					<div className="url">
						<a target="_blank" href={instagram.url}>
							<span className="metadata">
								[<span className="date">{instagram.date}</span>]
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

		const githubActivity = this.props.data.githubActivity.map((activity) => {
			return (
				<div key={activity.repo_name + activity.timestamp} className="github-activity">
					<span className="metadata">
						[<span className="date">{activity.date}</span>]
					</span>
					<span className="url">
						<a href={"https://github.com/" + activity.repo_name} target="_blank">
							{activity.repo_name} ({activity.num_commits} commits)
						</a>
					</span>
				</div>
			);
		});

		return (
			<div className="date-detail-list">
				{links}
				{instagrams}
				{githubActivity}
			</div>
		);
	}
}

export default DateDetailList;
