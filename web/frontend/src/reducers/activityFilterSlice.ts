import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActivityFilters } from '../constants/activityFilters';

interface ActivityFilterState {
	filter: string;
}

const initialState: ActivityFilterState = {
	filter: ActivityFilters.SHOW_ALL,
};

const activityFilterSlice = createSlice({
	name: 'ActivityFilter',
	initialState,
	reducers: {
		setActivityFilter: (state, action: PayloadAction<{ value: string }>) => {
			state.filter = action.payload.value;
		},
	},
});

export const { setActivityFilter } = activityFilterSlice.actions;
export default activityFilterSlice.reducer;

