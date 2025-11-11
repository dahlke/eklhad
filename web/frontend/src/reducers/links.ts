import { REQUEST_LINKS, RECEIVE_LINKS, type LinksAction } from "../actions/links";
import type { Link } from "../types";

interface LinksState {
	items: Link[];
	isFetching?: boolean;
	lastUpdated?: number;
}

const links = (state: LinksState = { items: [] }, action: LinksAction): LinksState => {
	switch (action.type) {
		case REQUEST_LINKS:
			return { ...state, isFetching: true };
		case RECEIVE_LINKS:
			return {
				...state,
				isFetching: false,
				items: action.links || [],
				lastUpdated: action.receivedAt,
			};
		default:
			return state;
	}
};

export default links;
