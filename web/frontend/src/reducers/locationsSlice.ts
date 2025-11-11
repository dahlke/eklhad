import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../constants/api';
import type { Location } from '../types';

// Re-export Location type for convenience (Map.tsx imports it from here)
export type { Location } from '../types';

interface LocationsState {
	items: Location[];
	isFetching: boolean;
	lastUpdated: number | null;
}

const initialState: LocationsState = {
	items: [],
	isFetching: false,
	lastUpdated: null,
};

export const fetchLocations = createAsyncThunk<Location[]>(
	'locations/fetch',
	async () => {
		const response = await fetch(`${API_BASE_URL}/locations`);
		if (!response.ok) {
			throw new Error('Failed to fetch locations');
		}
		const locations = await response.json() as Location[];
		if (!Array.isArray(locations)) {
			throw new Error('Expected array of locations');
		}
		return locations;
	}
);

const locationsSlice = createSlice({
	name: 'locations',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchLocations.pending, (state) => {
				state.isFetching = true;
			})
			.addCase(fetchLocations.fulfilled, (state, action) => {
				state.isFetching = false;
				state.items = action.payload;
				state.lastUpdated = Date.now();
			})
			.addCase(fetchLocations.rejected, (state) => {
				state.isFetching = false;
			});
	},
});

export default locationsSlice.reducer;

