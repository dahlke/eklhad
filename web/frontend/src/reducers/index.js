import { combineReducers } from "redux";
import locations from "./locations";
import links from "./links";
import blogs from "./blogs";
import instagrams from "./instagrams";
import tweets from "./tweets";
import gravatar from "./gravatar";
import github from "./github";
import ActivityFilter from "./activityFilter";
import DateFilter from "./dateFilter";

export default combineReducers({
	locations,
	links,
	blogs,
	instagrams,
	tweets,
	gravatar,
	github,
	ActivityFilter,
	DateFilter,
});
