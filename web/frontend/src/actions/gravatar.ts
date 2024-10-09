import { API_BASE_URL } from "./index";

console.log("Neil")

/* Gravatar */
export const REQUEST_GRAVATAR = "REQUEST_GRAVATAR";
function requestGravatar(): { type: string } { // Added return type
	return {
		type: REQUEST_GRAVATAR,
	};
}

export const RECEIVE_GRAVATAR = "RECEIVE_GRAVATAR";
function receiveGravatar(value: string): { type: string; gravatar: string; receivedAt: number } { // Added parameter and return types
	return {
		type: RECEIVE_GRAVATAR,
		gravatar: value,
		receivedAt: Date.now(),
	};
}

export function fetchGravatar(): (dispatch: (action: { type: string; gravatar?: string; receivedAt?: number }) => void) => Promise<void> { // Added return type
	const apiUrl = `${API_BASE_URL}/gravatar`;

	return (dispatch: (action: { type: string; gravatar?: string; receivedAt?: number }) => void) => { // Added parameter type
		dispatch(requestGravatar());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error),
			)
			.then((value: string) => dispatch(receiveGravatar(value))); // Added parameter type
	};
}
