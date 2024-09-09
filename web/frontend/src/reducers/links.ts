import { REQUEST_LINKS, RECEIVE_LINKS } from "../actions/links";

interface LinksState {
    items: any[];
    isFetching?: boolean;
    lastUpdated?: number;
}

interface LinksAction {
    type: string;
    links?: any[];
    receivedAt?: number;
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
