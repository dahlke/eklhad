import { API_BASE_URL } from "./index";

/* GitHub Events */
export const REQUEST_GITHUB_EVENTS = "REQUEST_GITHUB_EVENTS";
function requestGitHubEvents() {
	return {
		type: REQUEST_GITHUB_EVENTS,
	};
}

export const RECEIVE_GITHUB_EVENTS = "RECEIVE_GITHUB_EVENTS";
function receiveGitHubEvents(json) {
	return {
		type: RECEIVE_GITHUB_EVENTS,
		githubEvents: json,
		receivedAt: Date.now(),
	};
}

export function fetchGitHubEvents() {
	const apiUrl = `${API_BASE_URL}/github`;

	return function (dispatch) {
		dispatch(requestGitHubEvents());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error)
			)
			.then((json) => dispatch(receiveGitHubEvents(json)));
	};
}
