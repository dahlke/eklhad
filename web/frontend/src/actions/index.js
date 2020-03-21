const PROTOCOL = window.location.protocol;
const DEFAULT_PORT = 80;
const PORT = PROTOCOL === "https:" ? 443 : (window.APP ? window.APP.apiPort : DEFAULT_PORT);
const HOST = window.APP ? window.APP.apiHost : window.location.hostname;
const API_BASE_URL = `${PROTOCOL}//${HOST}:${PORT}/api`;

/* Visibility Filters */
export const setVisibilityFilter = filter => ({
  type: 'SET_VISIBILITY_FILTER',
  filter
})

export const VisibilityFilters = {
  SHOW_ALL: 'SHOW_ALL',
  SHOW_INSTAGRAMS: 'SHOW_INSTAGRAMS',
  SHOW_LINKS: 'SHOW_LINKS'
}

/* Locations */
export const REQUEST_LOCATIONS = 'REQUEST_LOCATIONS'
function requestLocations() {
  return {
    type: REQUEST_LOCATIONS
  }
}

export const RECEIVE_LOCATIONS = 'RECEIVE_LOCATIONS'
function receiveLocations(json) {
  return {
    type: RECEIVE_LOCATIONS,
    locations: json,
    receivedAt: Date.now()
  }
}

export function fetchLocations() {
  const apiUrl = `${API_BASE_URL}/locations`;

  return function(dispatch) {
    dispatch(requestLocations())

    return fetch(apiUrl)
      .then(
        response => response.json(),
        error => console.log('An error occurred.', error)
      )
      .then(json =>
        dispatch(receiveLocations(json))
      )
  }
}
