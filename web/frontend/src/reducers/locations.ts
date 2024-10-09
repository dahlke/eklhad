import { REQUEST_LOCATIONS, RECEIVE_LOCATIONS } from "../actions/locations";

interface LocationsState {
    items: any[];
    isFetching?: boolean;
    lastUpdated?: number;
}

interface LocationsAction {
    type: string;
    locations?: any[];
    receivedAt?: number;
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
