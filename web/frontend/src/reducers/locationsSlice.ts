import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../constants/api';

export interface Location {
	id: string;
	lat: number;
	lng: number;
	current?: boolean;
	layover?: boolean;
	home?: boolean;
	city?: string;
	stateprovinceregion?: string;
	country?: string;
}

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

export const fetchLocations = createAsyncThunk(
	'locations/fetch',
	async () => {
		const response = await fetch(`${API_BASE_URL}/locations`);
		if (!response.ok) {
			throw new Error('Failed to fetch locations');
		}
		return response.json();
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

