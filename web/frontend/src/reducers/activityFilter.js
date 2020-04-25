import { ActivityFilters } from "../actions";

const ActivityFilter = (state = ActivityFilters.SHOW_ALL, action) => {
	switch (action.type) {
		case "SET_ACTIVITY_FILTER":
			return action.filter.value;
		default:
			return state;
	}
};

export default ActivityFilter;
