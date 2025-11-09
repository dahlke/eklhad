import gravatar from './gravatar';
import { REQUEST_GRAVATAR, RECEIVE_GRAVATAR } from '../actions/gravatar';

describe('gravatar reducer', () => {
  it('should return the initial state', () => {
    expect(gravatar(undefined, { type: 'UNKNOWN' })).toEqual({ email: '' });
  });

  it('should handle REQUEST_GRAVATAR', () => {
    const initialState = { email: '' };
    const action = { type: REQUEST_GRAVATAR };
    const expectedState = { email: '', isFetching: true };

    expect(gravatar(initialState, action)).toEqual(expectedState);
  });

  it('should handle RECEIVE_GRAVATAR', () => {
    const initialState = { email: '', isFetching: true };
    const action = {
      type: RECEIVE_GRAVATAR,
      gravatar: 'test@example.com',
      receivedAt: 1234567890
    };
    const expectedState = {
      email: 'test@example.com',
      isFetching: false,
      lastUpdated: 1234567890
    };

    expect(gravatar(initialState, action)).toEqual(expectedState);
  });

  it('should handle RECEIVE_GRAVATAR with empty gravatar', () => {
    const initialState = { email: '', isFetching: true };
    const action = {
      type: RECEIVE_GRAVATAR,
      receivedAt: 1234567890
    };
    const expectedState = {
      email: '',
      isFetching: false,
      lastUpdated: 1234567890
    };

    expect(gravatar(initialState, action)).toEqual(expectedState);
  });
});

