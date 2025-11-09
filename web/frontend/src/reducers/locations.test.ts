import locations from './locations';
import { REQUEST_LOCATIONS, RECEIVE_LOCATIONS } from '../actions/locations';

describe('locations reducer', () => {
  it('should return the initial state', () => {
    expect(locations(undefined, { type: 'UNKNOWN' })).toEqual({ items: [] });
  });

  it('should handle REQUEST_LOCATIONS', () => {
    const initialState = { items: [] };
    const action = { type: REQUEST_LOCATIONS };
    const expectedState = { items: [], isFetching: true };

    expect(locations(initialState, action)).toEqual(expectedState);
  });

  it('should handle RECEIVE_LOCATIONS', () => {
    const initialState = { items: [], isFetching: true };
    const mockLocations = [
      { id: '1', city: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 }
    ];
    const action = {
      type: RECEIVE_LOCATIONS,
      locations: mockLocations,
      receivedAt: 1234567890
    };
    const expectedState = {
      items: mockLocations,
      isFetching: false,
      lastUpdated: 1234567890
    };

    expect(locations(initialState, action)).toEqual(expectedState);
  });

  it('should handle RECEIVE_LOCATIONS with empty locations array', () => {
    const initialState = { items: [], isFetching: true };
    const action = {
      type: RECEIVE_LOCATIONS,
      locations: [],
      receivedAt: 1234567890
    };
    const expectedState = {
      items: [],
      isFetching: false,
      lastUpdated: 1234567890
    };

    expect(locations(initialState, action)).toEqual(expectedState);
  });
});

