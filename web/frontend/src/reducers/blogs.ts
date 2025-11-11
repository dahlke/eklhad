import { REQUEST_BLOGS, RECEIVE_BLOGS, type BlogAction } from "../actions/blogs";
import type { Blog } from "../types";

interface BlogState {
	items: Blog[];
	isFetching?: boolean;
	lastUpdated?: number;
}

const blogs = (state: BlogState = { items: [] }, action: BlogAction): BlogState => {
	switch (action.type) {
		case REQUEST_BLOGS:
			return { ...state, isFetching: true };
		case RECEIVE_BLOGS:
			return {
				...state,
				isFetching: false,
				items: action.blogs || [],
				lastUpdated: action.receivedAt,
			};
		default:
			return state;
	}
};

export default blogs;
