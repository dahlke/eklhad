import DateFilter from './dateFilter';

describe('DateFilter reducer', () => {
  it('should return the initial state', () => {
    expect(DateFilter(undefined, { type: 'UNKNOWN' })).toEqual({ date: null });
  });

  it('should handle SET_DATE_FILTER', () => {
    const initialState = { date: null };
    const action = {
      type: 'SET_DATE_FILTER',
      filter: { date: '2024-01-01' }
    };
    const expectedState = { date: '2024-01-01' };

    expect(DateFilter(initialState, action)).toEqual(expectedState);
  });

  it('should handle SET_DATE_FILTER with null filter', () => {
    const initialState = { date: '2024-01-01' };
    const action = {
      type: 'SET_DATE_FILTER',
      filter: undefined
    };
    const expectedState = { date: null };

    expect(DateFilter(initialState, action)).toEqual(expectedState);
  });
});

