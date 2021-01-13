import { API_BASE_URL } from "./index";

/* Instagrams */
export const REQUEST_INSTAGRAMS = "REQUEST_INSTAGRAMS";
function requestInstagrams() {
	return {
		type: REQUEST_INSTAGRAMS,
	};
}

export const RECEIVE_INSTAGRAMS = "RECEIVE_INSTAGRAMS";
function receiveInstagrams(json) {
	return {
		type: RECEIVE_INSTAGRAMS,
		instagrams: json,
		receivedAt: Date.now(),
	};
}

export function fetchInstagrams() {
	const apiUrl = `${API_BASE_URL}/instagrams`;

	return (dispatch) => {
		dispatch(requestInstagrams());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error),
			)
			.then((json) => dispatch(receiveInstagrams(json)));
	};
}
