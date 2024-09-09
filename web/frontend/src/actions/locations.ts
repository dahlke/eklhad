import { API_BASE_URL } from "./index";

/* Locations */
export const REQUEST_LOCATIONS = "REQUEST_LOCATIONS";
function requestLocations() {
	return {
		type: REQUEST_LOCATIONS,
	};
}

export const RECEIVE_LOCATIONS = "RECEIVE_LOCATIONS";
function receiveLocations(json: any): { type: string; locations: any; receivedAt: number } { // Added parameter and return types
	return {
		type: RECEIVE_LOCATIONS,
		locations: json,
		receivedAt: Date.now(),
	};
}

export function fetchLocations(): (dispatch: (action: { type: string; locations?: any; receivedAt?: number }) => void) => Promise<void> { // Added return type
	const apiUrl = `${API_BASE_URL}/locations`;

	return (dispatch) => {
		dispatch(requestLocations());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error),
			)
			.then((json) => dispatch(receiveLocations(json)));
	};
}
