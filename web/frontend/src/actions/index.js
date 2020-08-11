export const PROTOCOL = window.location.protocol;
// NOTE: Default app port is required for local development, since 
// running react-scripts start does not take the server into equation
// we need to fall back on the port we should communicate with.
export const DEFAULT_APP_PORT = 3554;
export const PORT =
	PROTOCOL === "https:"
		? 443
		: window.APP
		? window.APP.apiPort
		: DEFAULT_APP_PORT;
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
