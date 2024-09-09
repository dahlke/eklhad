import { combineReducers } from "redux";
import locations from "./locations";
import links from "./links";
import blogs from "./blogs";
import gravatar from "./gravatar";
import ActivityFilter from "./activityFilter";
import DateFilter from "./dateFilter";

export default combineReducers({
	locations,
	links,
	blogs,
	gravatar,
	ActivityFilter,
	DateFilter,
});
