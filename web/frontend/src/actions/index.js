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
	SHOW_GITHUB_ACTIVITY: "SHOW_GITHUB_ACTIVITY",
};

/* Date Filter */
export const setDateFilter = (filter) => ({
	type: "SET_DATE_FILTER",
	filter,
});
