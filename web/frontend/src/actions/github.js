import { API_BASE_URL } from "./index";

/* GitHub Activity */
export const REQUEST_GITHUB_ACTIVITY = "REQUEST_GITHUB_ACTIVITY";
function requestGitHubActivity() {
	return {
		type: REQUEST_GITHUB_ACTIVITY,
	};
}

export const RECEIVE_GITHUB_ACTIVITY = "RECEIVE_GITHUB_ACTIVITY";
function receiveGitHubActivity(json) {
	return {
		type: RECEIVE_GITHUB_ACTIVITY,
		githubActivity: json,
		receivedAt: Date.now(),
	};
}

export function fetchGitHubActivity() {
	const apiUrl = `${API_BASE_URL}/github_activity`;

	return (dispatch) => {
		dispatch(requestGitHubActivity());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error),
			)
			.then((json) => dispatch(receiveGitHubActivity(json)));
	};
}
