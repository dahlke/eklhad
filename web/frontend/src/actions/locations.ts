import { API_BASE_URL } from "./index";
import type { Location } from "../types";

/* Locations */
export const REQUEST_LOCATIONS = "REQUEST_LOCATIONS";
function requestLocations(): { type: string } {
	return {
		type: REQUEST_LOCATIONS,
	};
}

export const RECEIVE_LOCATIONS = "RECEIVE_LOCATIONS";
function receiveLocations(locations: Location[]): { type: string; locations: Location[]; receivedAt: number } {
	return {
		type: RECEIVE_LOCATIONS,
		locations,
		receivedAt: Date.now(),
	};
}

export interface LocationsAction {
	type: string;
	locations?: Location[];
	receivedAt?: number;
}

export function fetchLocations(): (dispatch: (action: LocationsAction) => void) => Promise<void> {
	const apiUrl = `${API_BASE_URL}/locations`;

	return (dispatch) => {
		dispatch(requestLocations());

		return fetch(apiUrl)
			.then(
				(response) => {
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					return response.json() as Promise<Location[]>;
				},
				(error) => {
					console.error("An error occurred.", error);
					throw error;
				},
			)
			.then((locations: Location[]) => {
				// Validate that we received an array
				if (!Array.isArray(locations)) {
					throw new Error("Expected array of locations");
				}
				dispatch(receiveLocations(locations));
			})
			.catch((error) => {
				console.error("Failed to fetch locations:", error);
			});
	};
}
