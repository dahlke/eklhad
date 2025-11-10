import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../constants/api';

interface Blog {
	timestamp: number;
	date?: string;
	[key: string]: any;
}

interface BlogsState {
	items: Blog[];
	isFetching: boolean;
	lastUpdated: number | null;
}

const initialState: BlogsState = {
	items: [],
	isFetching: false,
	lastUpdated: null,
};

export const fetchBlogs = createAsyncThunk(
	'blogs/fetch',
	async () => {
		const response = await fetch(`${API_BASE_URL}/blogs`);
		if (!response.ok) {
			throw new Error('Failed to fetch blogs');
		}
		return response.json();
	}
);

const blogsSlice = createSlice({
	name: 'blogs',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchBlogs.pending, (state) => {
				state.isFetching = true;
			})
			.addCase(fetchBlogs.fulfilled, (state, action) => {
				state.isFetching = false;
				state.items = action.payload;
				state.lastUpdated = Date.now();
			})
			.addCase(fetchBlogs.rejected, (state) => {
				state.isFetching = false;
			});
	},
});

export default blogsSlice.reducer;

