export const PROTOCOL = window.location.protocol;
export const DEFAULT_PORT = 80;
export const PORT =
	PROTOCOL === "https:"
		? 443
		: window.APP
		? window.APP.apiPort
		: DEFAULT_PORT;
export const HOST = window.APP ? window.APP.apiHost : window.location.hostname;
export const API_BASE_URL = `${PROTOCOL}//${HOST}:${PORT}/api`;

/* Activity Filters */
export const setActivityFilter = (filter) => ({
	type: "SET_ACTIVITY_FILTER",
	filter,
});

export const ActivityFilters = {
	SHOW_ALL: "SHOW_ALL",
	SHOW_INSTAGRAMS: "SHOW_INSTAGRAMS",
	SHOW_LINKS: "SHOW_LINKS",
	SHOW_GITHUB_EVENTS: "SHOW_GITHUB_EVENTS",
};

/* Year Filters */
export const setYearFilter = (filter) => ({
	type: "SET_YEAR_FILTER",
	filter,
});

// TODO: make this dynamic somehow

/*
const EARLIEST_YEAR = 2012;
const yearCursor = new Date().getFullYear();
export const YearFilters = {}

while (yearCursor >= EARLIEST_YEAR) {
  YearFilters[yearCursor] = yearCursor;
}
*/
export const YearFilters = {
	2020: 2020,
	2019: 2019,
	2018: 2018,
	2017: 2017,
	2016: 2016,
	2014: 2014,
	2013: 2013,
	2012: 2012,
};

/* Date Filter */
export const setDateFilter = (filter) => ({
	type: "SET_DATE_FILTER",
	filter,
});
