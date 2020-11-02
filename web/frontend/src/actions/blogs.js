import { API_BASE_URL } from "./index";

/* Locations */
export const REQUEST_BLOGS = "REQUEST_BLOGS";
function requestBlogs() {
	return {
		type: REQUEST_BLOGS,
	};
}

export const RECEIVE_BLOGS = "RECEIVE_BLOGS";
function receiveBlogs(json) {
	return {
		type: RECEIVE_BLOGS,
		blogs: json,
		receivedAt: Date.now(),
	};
}

export function fetchBlogs() {
	const apiUrl = `${API_BASE_URL}/blogs`;

	return function (dispatch) {
		dispatch(requestBlogs());

		return fetch(apiUrl)
			.then(
				(response) => response.json(),
				(error) => console.error("An error occurred.", error)
			)
			.then((json) => dispatch(receiveBlogs(json)));
	};
}
