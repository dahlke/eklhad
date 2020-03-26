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
        error => console.error('An error occurred.', error)
      )
      .then(json =>
        dispatch(receiveLocations(json))
      )
  }
}


/* Instagrams */
export const REQUEST_INSTAGRAMS = 'REQUEST_INSTAGRAMS'
function requestInstagrams() {
  return {
    type: REQUEST_INSTAGRAMS
  }
}

export const RECEIVE_INSTAGRAMS = 'RECEIVE_INSTAGRAMS'
function receiveInstagrams(json) {
  return {
    type: RECEIVE_INSTAGRAMS,
    instagrams: json,
    receivedAt: Date.now()
  }
}

export function fetchInstagrams() {
  const apiUrl = `${API_BASE_URL}/instagrams`;

  return function(dispatch) {
    dispatch(requestInstagrams())

    return fetch(apiUrl)
      .then(
        response => response.json(),
        error => console.error('An error occurred.', error)
      )
      .then(json =>
        dispatch(receiveInstagrams(json))
      )
  }
}


/* Links */
export const REQUEST_LINKS = 'REQUEST_LINKS'
function requestLinks() {
  return {
    type: REQUEST_LINKS
  }
}

export const RECEIVE_LINKS = 'RECEIVE_LINKS'
function receiveLinks(json) {
  return {
    type: RECEIVE_LINKS,
    links: json,
    receivedAt: Date.now()
  }
}

export function fetchLinks() {
  const apiUrl = `${API_BASE_URL}/links`;

  return function(dispatch) {
    dispatch(requestLinks())

    return fetch(apiUrl)
      .then(
        response => response.json(),
        error => console.error('An error occurred.', error)
      )
      .then(json =>
        dispatch(receiveLinks(json))
      )
  }
}
