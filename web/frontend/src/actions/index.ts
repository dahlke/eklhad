// Re-export API constants for backward compatibility
export {
	PROTOCOL,
	IS_HTTPS,
	HAS_SERVER_CONFIG,
	DEFAULT_APP_PORT,
	PORT,
	HOST,
	API_BASE_URL,
} from "../constants/api";

// Import actions from slices
import { setActivityFilter as setActivityFilterAction } from "../reducers/activityFilterSlice";
import { setDateFilter as setDateFilterAction } from "../reducers/dateFilterSlice";

// Re-export ActivityFilters for backward compatibility
export { ActivityFilters } from "../constants/activityFilters";

// Wrapper action creators for backward compatibility with old API
export const setActivityFilter = (filter: { value: string }) =>
	setActivityFilterAction({ value: filter.value });

export const setDateFilter = (filter?: { date: string }) =>
	setDateFilterAction(filter ? { date: filter.date } : undefined);
