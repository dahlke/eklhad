import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../constants/api';
import type { Link } from '../types';

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

export const fetchLinks = createAsyncThunk<Link[]>(
	'links/fetch',
	async () => {
		const response = await fetch(`${API_BASE_URL}/links`);
		if (!response.ok) {
			throw new Error('Failed to fetch links');
		}
		const links = await response.json() as Link[];
		if (!Array.isArray(links)) {
			throw new Error('Expected array of links');
		}
		return links;
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

