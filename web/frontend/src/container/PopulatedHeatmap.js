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

function _processHeatmapDateMap(instagrams, links, githubActivity) {
	let heatmapDateMap = {};

	links.forEach((link) => {
		const d = moment.unix(link.timestamp).format("YYYY-MM-DD");
		link.date = d;
		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = {
				instagrams: [],
				links: [],
				githubActivity: [],
			};
		}
		heatmapDateMap[d]["links"].push(link);
	});

	instagrams.forEach((instagram) => {
		const d = moment.unix(instagram.timestamp).format("YYYY-MM-DD");
		instagram.date = d;
		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = {
				instagrams: [],
				links: [],
				githubActivity: [],
			};
		}
		heatmapDateMap[d]["instagrams"].push(instagram);
	});

	githubActivity.forEach((activity) => {
		const d = moment.unix(activity.timestamp).format("YYYY-MM-DD");
		activity.date = d;
		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = {
				instagrams: [],
				links: [],
				githubActivity: [],
			};
		}
		heatmapDateMap[d]["githubActivity"].push(activity);
	});

	return heatmapDateMap;
}

const mapStateToProps = (state) => {
	const sortedInstagrams = _sortByTimestamp(state.instagrams.items);
	const sortedLinks = _sortByTimestamp(state.links.items);
	const sortedGitHubActivity = _sortByTimestamp(state.github.activity);

	const heatmapDateMap = _processHeatmapDateMap(
		sortedInstagrams,
		sortedLinks,
		sortedGitHubActivity
	);

	const dataForDate = state.dateFilter
		? heatmapDateMap[state.dateFilter]
		: [];

	return {
		instagrams: sortedInstagrams,
		links: sortedLinks,
		githubActivity: sortedGitHubActivity,
		heatmapDateMap: heatmapDateMap,
		activityFilter: state.ActivityFilter,
		dateFilter: state.DateFilter,
		dataForDate: dataForDate
	};
};

const mapDispatchToProps = (dispatch) => ({
	setActivityFilter: (filter) => dispatch(setActivityFilter(filter)),
	setDateFilter: (filter) => dispatch(setDateFilter(filter)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Heatmap);
