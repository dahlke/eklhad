import ActivityFilter from './activityFilter';
import { ActivityFilters } from '../actions';

describe('ActivityFilter reducer', () => {
  it('should return the initial state', () => {
    expect(ActivityFilter(undefined, { type: 'UNKNOWN' })).toEqual({ filter: ActivityFilters.SHOW_ALL });
  });

  it('should handle SET_ACTIVITY_FILTER', () => {
    const initialState = { filter: ActivityFilters.SHOW_ALL };
    const action = {
      type: 'SET_ACTIVITY_FILTER',
      filter: { value: ActivityFilters.SHOW_BLOGS }
    };
    const expectedState = { filter: ActivityFilters.SHOW_BLOGS };

    expect(ActivityFilter(initialState, action)).toEqual(expectedState);
  });

  it('should handle SET_ACTIVITY_FILTER with different filter values', () => {
    const initialState = { filter: ActivityFilters.SHOW_BLOGS };
    const action = {
      type: 'SET_ACTIVITY_FILTER',
      filter: { value: ActivityFilters.SHOW_LINKS }
    };
    const expectedState = { filter: ActivityFilters.SHOW_LINKS };

    expect(ActivityFilter(initialState, action)).toEqual(expectedState);
  });
});

