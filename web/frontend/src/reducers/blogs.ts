import { REQUEST_BLOGS, RECEIVE_BLOGS } from "../actions/blogs";

interface BlogState {
    items: any[];
    isFetching?: boolean;
    lastUpdated?: number;
}

interface BlogAction {
    type: string;
    blogs?: any[];
    receivedAt?: number;
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
