import links from './links';
import { REQUEST_LINKS, RECEIVE_LINKS } from '../actions/links';

describe('links reducer', () => {
  it('should return the initial state', () => {
    expect(links(undefined, { type: 'UNKNOWN' })).toEqual({ items: [] });
  });

  it('should handle REQUEST_LINKS', () => {
    const initialState = { items: [] };
    const action = { type: REQUEST_LINKS };
    const expectedState = { items: [], isFetching: true };

    expect(links(initialState, action)).toEqual(expectedState);
  });

  it('should handle RECEIVE_LINKS', () => {
    const initialState = { items: [], isFetching: true };
    const mockLinks = [
      { id: '1', name: 'Test Link', url: 'https://example.com' }
    ];
    const action = {
      type: RECEIVE_LINKS,
      links: mockLinks,
      receivedAt: 1234567890
    };
    const expectedState = {
      items: mockLinks,
      isFetching: false,
      lastUpdated: 1234567890
    };

    expect(links(initialState, action)).toEqual(expectedState);
  });

  it('should handle RECEIVE_LINKS with empty links array', () => {
    const initialState = { items: [], isFetching: true };
    const action = {
      type: RECEIVE_LINKS,
      links: [],
      receivedAt: 1234567890
    };
    const expectedState = {
      items: [],
      isFetching: false,
      lastUpdated: 1234567890
    };

    expect(links(initialState, action)).toEqual(expectedState);
  });
});

