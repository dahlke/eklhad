import { API_BASE_URL } from "./index";

/* Links */
export const REQUEST_LINKS = "REQUEST_LINKS";
function requestLinks() {
	return {
		type: REQUEST_LINKS,
	};
}

export const RECEIVE_LINKS = "RECEIVE_LINKS";
function receiveLinks(json: any): { type: string; links: any; receivedAt: number } { // Added parameter and return types
	return {
		type: RECEIVE_LINKS,
		links: json,
		receivedAt: Date.now(),
	};
}

export function fetchLinks(): (dispatch: (action: { type: string; links?: any; receivedAt?: number }) => void) => Promise<void> { // Added return type
	const apiUrl = `${API_BASE_URL}/links`;

	return (dispatch) => {
		dispatch(requestLinks());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error),
			)
			.then((json) => dispatch(receiveLinks(json)));
	};
}
