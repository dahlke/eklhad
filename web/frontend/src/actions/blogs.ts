import { API_BASE_URL } from "./index";
import type { Blog } from "../types";

/* Blogs */
export const REQUEST_BLOGS = "REQUEST_BLOGS";
function requestBlogs(): { type: string } {
	return {
		type: REQUEST_BLOGS,
	};
}

export const RECEIVE_BLOGS = "RECEIVE_BLOGS";
function receiveBlogs(blogs: Blog[]): { type: string; blogs: Blog[]; receivedAt: number } {
	return {
		type: RECEIVE_BLOGS,
		blogs,
		receivedAt: Date.now(),
	};
}

export interface BlogAction {
	type: string;
	blogs?: Blog[];
	receivedAt?: number;
}

export function fetchBlogs(): (dispatch: (action: BlogAction) => void) => Promise<void> {
	const apiUrl = `${API_BASE_URL}/blogs`;

	return (dispatch) => {
		dispatch(requestBlogs());

		return fetch(apiUrl)
			.then(
				(response) => {
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					return response.json() as Promise<Blog[]>;
				},
				(error) => {
					console.error("An error occurred.", error);
					throw error;
				},
			)
			.then((blogs: Blog[]) => {
				// Validate that we received an array
				if (!Array.isArray(blogs)) {
					throw new Error("Expected array of blogs");
				}
				dispatch(receiveBlogs(blogs));
			})
			.catch((error) => {
				console.error("Failed to fetch blogs:", error);
			});
	};
}
