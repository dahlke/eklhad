import { ActivityFilters } from "../actions";

interface ActivityFilterState {
    filter: string;
}

interface ActivityFilterAction {
    type: string;
    filter: {
        value: string;
    };
}

const ActivityFilter = (state: ActivityFilterState = { filter: ActivityFilters.SHOW_ALL }, action: ActivityFilterAction): ActivityFilterState => {
	switch (action.type) {
	case "SET_ACTIVITY_FILTER":
		return { filter: action.filter.value };
	default:
		return state;
	}
};

export default ActivityFilter;
