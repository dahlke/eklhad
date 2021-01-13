import { REQUEST_LINKS, RECEIVE_LINKS } from "../actions/links";

const links = (state = { items: [] }, action) => {
	switch (action.type) {
		case REQUEST_LINKS:
			return { ...state, isFetching: true };
		case RECEIVE_LINKS:
			return {
				...state,
				isFetching: false,
				items: action.links,
				lastUpdated: action.receivedAt,
			};
		default:
			return state;
	}
};

export default links;
