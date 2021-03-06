import { REQUEST_INSTAGRAMS, RECEIVE_INSTAGRAMS } from "../actions/instagrams";

const instagrams = (state = { items: [] }, action) => {
	switch (action.type) {
		case REQUEST_INSTAGRAMS:
			return { ...state, isFetching: true };
		case RECEIVE_INSTAGRAMS:
			return {
				...state,
				isFetching: false,
				items: action.instagrams,
				lastUpdated: action.receivedAt,
			};
		default:
			return state;
	}
};

export default instagrams;
