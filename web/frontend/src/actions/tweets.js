import { API_BASE_URL } from "./index";

/* Tweets */
export const REQUEST_TWEETS = "REQUEST_TWEETS";
function requestTweets() {
	return {
		type: REQUEST_TWEETS,
	};
}

export const RECEIVE_TWEETS = "RECEIVE_TWEETS";
function receiveTweets(json) {
	return {
		type: RECEIVE_TWEETS,
		tweets: json,
		receivedAt: Date.now(),
	};
}

export function fetchTweets() {
	const apiUrl = `${API_BASE_URL}/tweets`;

	return (dispatch) => {
		dispatch(requestTweets());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error),
			)
			.then((json) => dispatch(receiveTweets(json)));
	};
}
