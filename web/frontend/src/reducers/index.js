import { combineReducers } from "redux";
import locations from "./locations";
import links from "./links";
import instagrams from "./instagrams";
import ActivityFilter from "./activityFilter";
import YearFilter from "./yearFilter";
import DateFilter from "./dateFilter";

export default combineReducers({
	locations,
	links,
	instagrams,
	ActivityFilter,
	YearFilter,
	DateFilter,
});
