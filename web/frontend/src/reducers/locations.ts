import { REQUEST_LOCATIONS, RECEIVE_LOCATIONS, type LocationsAction } from "../actions/locations";
import type { Location } from "../types";

interface LocationsState {
	items: Location[];
	isFetching?: boolean;
	lastUpdated?: number;
}

const locations = (state: LocationsState = { items: [] }, action: LocationsAction): LocationsState => {
	switch (action.type) {
		case REQUEST_LOCATIONS:
			return { ...state, isFetching: true };
		case RECEIVE_LOCATIONS:
			return {
				...state,
				isFetching: false,
				items: action.locations || [],
				lastUpdated: action.receivedAt,
			};
		default:
			return state;
	}
};

export default locations;
