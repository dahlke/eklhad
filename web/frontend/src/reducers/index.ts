import { combineReducers } from "@reduxjs/toolkit";
import locations from "./locationsSlice";
import links from "./linksSlice";
import blogs from "./blogsSlice";
import gravatar from "./gravatarSlice";
import ActivityFilter from "./activityFilterSlice";
import DateFilter from "./dateFilterSlice";

const rootReducer = combineReducers({
	locations,
	links,
	blogs,
	gravatar,
	ActivityFilter,
	DateFilter,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
