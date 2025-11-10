import locationsReducer, { fetchLocations } from './locationsSlice';
import type { Location } from './locationsSlice';

describe('locationsSlice', () => {
	it('should return the initial state', () => {
		expect(locationsReducer(undefined, { type: 'UNKNOWN' })).toEqual({
			items: [],
			isFetching: false,
			lastUpdated: null,
		});
	});

	it('should handle fetchLocations.pending', () => {
		const initialState = {
			items: [],
			isFetching: false,
			lastUpdated: null,
		};
		const action = fetchLocations.pending('', undefined);
		const expectedState = {
			items: [],
			isFetching: true,
			lastUpdated: null,
		};

		expect(locationsReducer(initialState, action)).toEqual(expectedState);
	});

	it('should handle fetchLocations.fulfilled', () => {
		const initialState = {
			items: [],
			isFetching: true,
			lastUpdated: null,
		};
		const mockLocations: Location[] = [
			{ id: '1', city: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
		];
		const action = fetchLocations.fulfilled(mockLocations, '', undefined);
		const result = locationsReducer(initialState, action);

		expect(result.items).toEqual(mockLocations);
		expect(result.isFetching).toBe(false);
		expect(result.lastUpdated).toBeGreaterThan(0);
	});

	it('should handle fetchLocations.rejected', () => {
		const initialState = {
			items: [],
			isFetching: true,
			lastUpdated: null,
		};
		const action = fetchLocations.rejected(new Error('Failed'), '', undefined);
		const expectedState = {
			items: [],
			isFetching: false,
			lastUpdated: null,
		};

		expect(locationsReducer(initialState, action)).toEqual(expectedState);
	});
});

