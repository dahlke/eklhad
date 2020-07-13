import { connect } from "react-redux";
import { setActivityFilter, setYearFilter, setDateFilter } from "../actions";

import Heatmap from "../component/heatmap/Heatmap";
import moment from "moment";

// TODO: since all these functions do the same thing, consolidate them.
function _processInstagrams(data) {
	data = data ? data : [];

	// TODO: use the same keys across data stream type
	data.sort((a, b) => {
		return b.timestamp - a.timestamp;
	});

	return data;
}

function _processLinks(data) {
	data = data ? data : [];

	data.sort((a, b) => {
		return b.timestamp - a.timestamp;
	});

	return data;
}

function _processGitHubActivity(data) {
	data = data ? data : [];

	data.sort((a, b) => {
		return b.timestamp - a.timestamp;
	});

	return data;
}

function _processHeatmapDateMap(instagrams, links, githubActivity) {
	var heatmapDateMap = {};

	// TODO: since all these functions do the same thing, consolidate them.
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
	const sortedInstagrams = _processInstagrams(state.instagrams.items);
	const sortedLinks = _processLinks(state.links.items);
	const sortedGitHubActivity = _processGitHubActivity(state.github.activity);

	const heatmapDateMap = _processHeatmapDateMap(
		sortedInstagrams,
		sortedLinks,
		sortedGitHubActivity
	);

	return {
		instagrams: sortedInstagrams,
		links: sortedLinks,
		githubActivity: sortedGitHubActivity,
		heatmapDateMap: heatmapDateMap,
		activityFilter: state.ActivityFilter,
		yearFilter: state.YearFilter,
		dateFilter: state.DateFilter,
	};
};

const mapDispatchToProps = (dispatch) => ({
	setActivityFilter: (filter) => dispatch(setActivityFilter(filter)),
	setYearFilter: (filter) => dispatch(setYearFilter(filter)),
	setDateFilter: (filter) => dispatch(setDateFilter(filter)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Heatmap);
