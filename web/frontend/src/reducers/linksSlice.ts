import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../constants/api';

interface Link {
	timestamp: number;
	[key: string]: any;
}

interface LinksState {
	items: Link[];
	isFetching: boolean;
	lastUpdated: number | null;
}

const initialState: LinksState = {
	items: [],
	isFetching: false,
	lastUpdated: null,
};

export const fetchLinks = createAsyncThunk(
	'links/fetch',
	async () => {
		const response = await fetch(`${API_BASE_URL}/links`);
		if (!response.ok) {
			throw new Error('Failed to fetch links');
		}
		return response.json();
	}
);

const linksSlice = createSlice({
	name: 'links',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchLinks.pending, (state) => {
				state.isFetching = true;
			})
			.addCase(fetchLinks.fulfilled, (state, action) => {
				state.isFetching = false;
				state.items = action.payload;
				state.lastUpdated = Date.now();
			})
			.addCase(fetchLinks.rejected, (state) => {
				state.isFetching = false;
			});
	},
});

export default linksSlice.reducer;

