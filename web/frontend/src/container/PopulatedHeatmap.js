import { connect } from "react-redux";
import { setActivityFilter, setDateFilter } from "../actions";

import Heatmap from "../component/heatmap/Heatmap";
import moment from "moment";

function _sortByTimestamp(data) {
	data = data ? data : [];

	data.sort((a, b) => {
		return b.timestamp - a.timestamp;
	});

	return data;
}

function _processHeatmapDateMap(instagrams, tweets, links, githubActivity) {
	let heatmapDateMap = {};

	const emptyHeatmapDate = {
		instagrams: [],
		tweets: [],
		links: [],
		githubActivity: [],
	};

	links.forEach((link) => {
		const d = moment.unix(link.timestamp).format("YYYY-MM-DD");
		link.date = d;
		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = JSON.parse(JSON.stringify(emptyHeatmapDate));
		}
		heatmapDateMap[d]["links"].push(link);
	});

	instagrams.forEach((instagram) => {
		const d = moment.unix(instagram.timestamp).format("YYYY-MM-DD");
		instagram.date = d;
		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = JSON.parse(JSON.stringify(emptyHeatmapDate));
		}
		heatmapDateMap[d]["instagrams"].push(instagram);
	});

	tweets.forEach((tweet) => {
		const d = moment.unix(tweet.timestamp).format("YYYY-MM-DD");
		tweet.date = d;
		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = JSON.parse(JSON.stringify(emptyHeatmapDate));
		}
		heatmapDateMap[d]["tweets"].push(tweet);
	});

	githubActivity.forEach((activity) => {
		const d = moment.unix(activity.timestamp).format("YYYY-MM-DD");
		activity.date = d;
		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = JSON.parse(JSON.stringify(emptyHeatmapDate));
		}
		heatmapDateMap[d]["githubActivity"].push(activity);
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
		sortedGitHubActivity
	);

	return {
		instagrams: sortedInstagrams,
		tweets: sortedTweets,
		links: sortedLinks,
		githubActivity: sortedGitHubActivity,
		heatmapDateMap: heatmapDateMap,
		activityFilter: state.ActivityFilter,
		dateFilter: state.DateFilter,
	};
};

const mapDispatchToProps = (dispatch) => ({
	setActivityFilter: (filter) => dispatch(setActivityFilter(filter)),
	setDateFilter: (filter) => dispatch(setDateFilter(filter)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Heatmap);
