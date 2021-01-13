import moment from "moment";
import { connect } from "react-redux";

import { setActivityFilter, setDateFilter } from "../actions";
import Heatmap from "../component/heatmap/Heatmap";

function _sortByTimestamp(rawData) {
	const data = rawData || [];

	data.sort((a, b) => b.timestamp - a.timestamp);

	return data;
}

function _processHeatmapDateMap(instagrams, tweets, links, githubActivity) {
	const heatmapDateMap = {};

	const emptyHeatmapDate = {
		instagrams: [],
		tweets: [],
		links: [],
		githubActivity: [],
	};

	links.forEach((link) => {
		const processedLink = link;
		const d = moment.unix(processedLink.timestamp).format("YYYY-MM-DD");

		processedLink.date = d;

		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = JSON.parse(JSON.stringify(emptyHeatmapDate));
		}

		heatmapDateMap[d].links.push(processedLink);
	});

	instagrams.forEach((instagram) => {
		const processedInstagram = instagram;
		const d = moment.unix(processedInstagram.timestamp).format("YYYY-MM-DD");

		processedInstagram.date = d;

		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = JSON.parse(JSON.stringify(emptyHeatmapDate));
		}

		heatmapDateMap[d].instagrams.push(processedInstagram);
	});

	tweets.forEach((tweet) => {
		const processedTweet = tweet;
		const d = moment.unix(processedTweet.timestamp).format("YYYY-MM-DD");

		processedTweet.date = d;

		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = JSON.parse(JSON.stringify(emptyHeatmapDate));
		}

		heatmapDateMap[d].tweets.push(processedTweet);
	});

	githubActivity.forEach((activity) => {
		const processedActivity = activity;
		const d = moment.unix(processedActivity.timestamp).format("YYYY-MM-DD");

		processedActivity.date = d;

		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = JSON.parse(JSON.stringify(emptyHeatmapDate));
		}

		heatmapDateMap[d].githubActivity.push(processedActivity);
	});

	return heatmapDateMap;
}

const mapStateToProps = (state) => {
	const sortedInstagrams = _sortByTimestamp(state.instagrams.items);
	const sortedTweets = _sortByTimestamp(state.tweets.items);
	const sortedLinks = _sortByTimestamp(state.links.items);
	const sortedGitHubActivity = _sortByTimestamp(state.github.activity);

	const heatmapDateMap = _processHeatmapDateMap(
		sortedInstagrams,
		sortedTweets,
		sortedLinks,
		sortedGitHubActivity,
	);

	return {
		instagrams: sortedInstagrams,
		tweets: sortedTweets,
		links: sortedLinks,
		githubActivity: sortedGitHubActivity,
		heatmapDateMap,
		activityFilter: state.ActivityFilter,
		dateFilter: state.DateFilter,
	};
};

const mapDispatchToProps = (dispatch) => ({
	setActivityFilter: (filter) => dispatch(setActivityFilter(filter)),
	setDateFilter: (filter) => dispatch(setDateFilter(filter)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Heatmap);
