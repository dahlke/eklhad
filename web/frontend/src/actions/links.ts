import { API_BASE_URL } from "./index";
import type { Link } from "../types";

/* Links */
export const REQUEST_LINKS = "REQUEST_LINKS";
function requestLinks(): { type: string } {
	return {
		type: REQUEST_LINKS,
	};
}

export const RECEIVE_LINKS = "RECEIVE_LINKS";
function receiveLinks(links: Link[]): { type: string; links: Link[]; receivedAt: number } {
	return {
		type: RECEIVE_LINKS,
		links,
		receivedAt: Date.now(),
	};
}

export interface LinksAction {
	type: string;
	links?: Link[];
	receivedAt?: number;
}

export function fetchLinks(): (dispatch: (action: LinksAction) => void) => Promise<void> {
	const apiUrl = `${API_BASE_URL}/links`;

	return (dispatch) => {
		dispatch(requestLinks());

		return fetch(apiUrl)
			.then(
				(response) => {
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					return response.json() as Promise<Link[]>;
				},
				(error) => {
					console.error("An error occurred.", error);
					throw error;
				},
			)
			.then((links: Link[]) => {
				// Validate that we received an array
				if (!Array.isArray(links)) {
					throw new Error("Expected array of links");
				}
				dispatch(receiveLinks(links));
			})
			.catch((error) => {
				console.error("Failed to fetch links:", error);
			});
	};
}
