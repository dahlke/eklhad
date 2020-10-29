import { API_BASE_URL } from "./index";

/* Gravatar */
export const REQUEST_GRAVATAR = "REQUEST_GRAVATAR";
function requestGravatar() {
	return {
		type: REQUEST_GRAVATAR,
	};
}

export const RECEIVE_GRAVATAR = "RECEIVE_GRAVATAR";
function receiveGravatar(value) {
	return {
		type: RECEIVE_GRAVATAR,
		gravatar: value,
		receivedAt: Date.now(),
	};
}

export function fetchGravatar() {
	const apiUrl = `${API_BASE_URL}/gravatar`;

	return function (dispatch) {
		dispatch(requestGravatar());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error)
			)
			.then((value) => dispatch(receiveGravatar(value)));
	};
}
