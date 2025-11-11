import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../constants/api';
import type { Blog } from '../types';

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

export const fetchBlogs = createAsyncThunk<Blog[]>(
	'blogs/fetch',
	async () => {
		const response = await fetch(`${API_BASE_URL}/blogs`);
		if (!response.ok) {
			throw new Error('Failed to fetch blogs');
		}
		const blogs = await response.json() as Blog[];
		if (!Array.isArray(blogs)) {
			throw new Error('Expected array of blogs');
		}
		return blogs;
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

