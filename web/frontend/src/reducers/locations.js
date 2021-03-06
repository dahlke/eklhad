import { REQUEST_LOCATIONS, RECEIVE_LOCATIONS } from "../actions/locations";

const locations = (state = { items: [] }, action) => {
	switch (action.type) {
		case REQUEST_LOCATIONS:
			return { ...state, isFetching: true };
		case RECEIVE_LOCATIONS:
			return {
				...state,
				isFetching: false,
				items: action.locations,
				lastUpdated: action.receivedAt,
			};
		default:
			return state;
	}
};

export default locations;
