import blogs from './blogs';
import { REQUEST_BLOGS, RECEIVE_BLOGS } from '../actions/blogs';

describe('blogs reducer', () => {
  it('should return the initial state', () => {
    expect(blogs(undefined, { type: 'UNKNOWN' })).toEqual({ items: [] });
  });

  it('should handle REQUEST_BLOGS', () => {
    const initialState = { items: [] };
    const action = { type: REQUEST_BLOGS };
    const expectedState = { items: [], isFetching: true };

    expect(blogs(initialState, action)).toEqual(expectedState);
  });

  it('should handle RECEIVE_BLOGS', () => {
    const initialState = { items: [], isFetching: true };
    const mockBlogs = [
      { id: '1', name: 'Test Blog', url: 'https://example.com' }
    ];
    const action = {
      type: RECEIVE_BLOGS,
      blogs: mockBlogs,
      receivedAt: 1234567890
    };
    const expectedState = {
      items: mockBlogs,
      isFetching: false,
      lastUpdated: 1234567890
    };

    expect(blogs(initialState, action)).toEqual(expectedState);
  });

  it('should handle RECEIVE_BLOGS with empty blogs array', () => {
    const initialState = { items: [], isFetching: true };
    const action = {
      type: RECEIVE_BLOGS,
      blogs: [],
      receivedAt: 1234567890
    };
    const expectedState = {
      items: [],
      isFetching: false,
      lastUpdated: 1234567890
    };

    expect(blogs(initialState, action)).toEqual(expectedState);
  });

  it('should handle RECEIVE_BLOGS with undefined blogs', () => {
    const initialState = { items: [], isFetching: true };
    const action = {
      type: RECEIVE_BLOGS,
      receivedAt: 1234567890
    };
    const expectedState = {
      items: [],
      isFetching: false,
      lastUpdated: 1234567890
    };

    expect(blogs(initialState, action)).toEqual(expectedState);
  });
});

