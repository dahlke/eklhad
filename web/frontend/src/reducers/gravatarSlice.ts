import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../constants/api';

interface GravatarState {
	email: string;
	isFetching: boolean;
	lastUpdated: number | null;
}

const initialState: GravatarState = {
	email: '',
	isFetching: false,
	lastUpdated: null,
};

export const fetchGravatar = createAsyncThunk(
	'gravatar/fetch',
	async () => {
		const response = await fetch(`${API_BASE_URL}/gravatar`);
		if (!response.ok) {
			throw new Error('Failed to fetch gravatar');
		}
		return response.json();
	}
);

const gravatarSlice = createSlice({
	name: 'gravatar',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchGravatar.pending, (state) => {
				state.isFetching = true;
			})
			.addCase(fetchGravatar.fulfilled, (state, action) => {
				state.isFetching = false;
				state.email = action.payload;
				state.lastUpdated = Date.now();
			})
			.addCase(fetchGravatar.rejected, (state) => {
				state.isFetching = false;
			});
	},
});

export default gravatarSlice.reducer;

