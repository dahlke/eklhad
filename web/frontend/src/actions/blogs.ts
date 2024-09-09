import { API_BASE_URL } from "./index";

/* Locations */
export const REQUEST_BLOGS = "REQUEST_BLOGS";
function requestBlogs() {
	return {
		type: REQUEST_BLOGS,
	};
}

export const RECEIVE_BLOGS = "RECEIVE_BLOGS";
function receiveBlogs(json: any): { type: string; blogs: any; receivedAt: number } {
	return {
		type: RECEIVE_BLOGS,
		blogs: json,
		receivedAt: Date.now(),
	};
}

export function fetchBlogs(): (dispatch: (action: { type: string; blogs?: any; receivedAt?: number }) => void) => Promise<void> {
	const apiUrl = `${API_BASE_URL}/blogs`;

	return (dispatch) => {
		dispatch(requestBlogs());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error),
			)
			.then((json) => dispatch(receiveBlogs(json)));
	};
}
