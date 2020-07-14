import { combineReducers } from "redux";
import locations from "./locations";
import links from "./links";
import instagrams from "./instagrams";
import gravatar from "./gravatar";
import github from "./github";
import ActivityFilter from "./activityFilter";
import DateFilter from "./dateFilter";

export default combineReducers({
	locations,
	links,
	instagrams,
	gravatar,
	github,
	ActivityFilter,
	DateFilter,
});
