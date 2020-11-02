import { REQUEST_BLOGS, RECEIVE_BLOGS } from "../actions/blogs";

const blogs = (state = { items: [] }, action) => {
	switch (action.type) {
		case REQUEST_BLOGS:
			return Object.assign({}, state, {
				isFetching: true,
			});
		case RECEIVE_BLOGS:
			return Object.assign({}, state, {
				isFetching: false,
				items: action.blogs,
				lastUpdated: action.receivedAt,
			});
		default:
			return state;
	}
};

export default blogs;
