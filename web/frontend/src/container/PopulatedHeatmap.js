import { connect } from "react-redux";
import { setActivityFilter, setYearFilter, setDateFilter } from "../actions";

import Heatmap from "../component/heatmap/Heatmap";
import moment from "moment";

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

function _processGitHubEvents(data) {
	data = data ? data : [];

	data.sort((a, b) => {
		return b.timestamp - a.timestamp;
	});

	return data;
}

function _processHeatmapDateMap(instagrams, links, githubEvents) {
	var heatmapDateMap = {};

	links.forEach((link) => {
		const d = moment.unix(link.timestamp).format("YYYY-MM-DD");
		link.date = d;
		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = {
				instagrams: [],
				links: [],
				github_events: [],
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
				github_events: [],
			};
		}
		heatmapDateMap[d]["instagrams"].push(instagram);
	});

	githubEvents.forEach((githubEvent) => {
		const d = moment.unix(githubEvent.timestamp).format("YYYY-MM-DD");
		githubEvent.date = d;
		if (!heatmapDateMap[d]) {
			heatmapDateMap[d] = {
				instagrams: [],
				links: [],
				github_events: [],
			};
		}
		heatmapDateMap[d]["github_events"].push(githubEvent);
	})

	return heatmapDateMap;
}

const mapStateToProps = (state) => {
	const sortedInstagrams = _processInstagrams(state.instagrams.items);
	const sortedLinks = _processLinks(state.links.items);
	const sortedGitHubEvents = _processGitHubEvents(state.github.items);
	const heatmapDateMap = _processHeatmapDateMap(
		sortedInstagrams,
		sortedLinks,
		sortedGitHubEvents
	);

	return {
		instagrams: sortedInstagrams,
		links: sortedLinks,
		githubEvents: sortedGitHubEvents,
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
