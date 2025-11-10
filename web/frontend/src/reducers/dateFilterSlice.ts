import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DateFilterState {
	date: string | null;
}

const initialState: DateFilterState = {
	date: null,
};

const dateFilterSlice = createSlice({
	name: 'DateFilter',
	initialState,
	reducers: {
		setDateFilter: (state, action: PayloadAction<{ date: string } | undefined>) => {
			state.date = action.payload?.date || null;
		},
	},
});

export const { setDateFilter } = dateFilterSlice.actions;
export default dateFilterSlice.reducer;

