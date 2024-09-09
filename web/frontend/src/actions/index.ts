export const PROTOCOL = window.location.protocol;
// NOTE: Default app port is required for local development, since
// running react-scripts start does not take the server into equation
// we need to fall back on the port we should communicate with.
export const IS_HTTPS = PROTOCOL.includes("https");
export const HAS_SERVER_CONFIG = !!window.APP;

export const DEFAULT_APP_PORT = 3554;
let appPort = DEFAULT_APP_PORT;

if (IS_HTTPS) {
	appPort = 443;
} else if (HAS_SERVER_CONFIG) {
	appPort = window.APP.apiPort;
}

console.log("APP PORT", appPort);

export const PORT = appPort;
export const HOST = window.APP ? window.APP.apiHost : window.location.hostname;
export const API_BASE_URL = `${PROTOCOL}//${HOST}:${PORT}/api`;

/* Activity Filters */
export const setActivityFilter = (filter) => ({
	type: "SET_ACTIVITY_FILTER",
	filter,
});

export const ActivityFilters = {
	SHOW_ALL: "SHOW_ALL",
	SHOW_LINKS: "SHOW_LINKS",
};

/* Date Filter */
export const setDateFilter = (filter) => ({
	type: "SET_DATE_FILTER",
	filter,
});
